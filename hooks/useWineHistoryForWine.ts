import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface HistoryEvent {
  id: string;
  event_type: string;
  created_at: string;
  rating?: number;
  comment?: string;
  stock_change?: number;
  source_user_id?: string;
  source_user_name?: string;
  source_user_avatar?: string;
}

interface FormattedHistoryEvent {
  id: string;
  date: string;
  text: string;
  type: 'add' | 'move' | 'delete' | 'stock' | 'taste' | 'favorite' | 'social';
  eventDate: string;
}

export function useWineHistoryForWine(wineId: string, userId: string) {
  const [history, setHistory] = useState<FormattedHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wineId || !userId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    // Si c'est un vin OCR (ID commence par 'ocr-'), ne pas essayer de charger l'historique
    if (wineId.startsWith('ocr-')) {
      console.log('🍷 Vin OCR détecté, pas de chargement de l\'historique');
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);

        // Récupérer l'historique des dégustations
        const { data: tasteHistory, error: tasteError } = await supabase
          .from('wine_history')
          .select(`
            id,
            event_type,
            event_date,
            notes
          `)
          .eq('wine_id', wineId)
          .eq('user_id', userId)
          .order('event_date', { ascending: false });

        // Récupérer le rating depuis user_wine
        const { data: userWineData, error: userWineError } = await supabase
          .from('user_wine')
          .select('rating')
          .eq('wine_id', wineId)
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (tasteError) throw tasteError;
        if (userWineError) throw userWineError;

        // Récupérer l'historique des changements de stock
        const { data: stockHistory, error: stockError } = await supabase
          .from('wine_history')
          .select(`
            id,
            event_type,
            event_date,
            previous_amount,
            new_amount
          `)
          .eq('wine_id', wineId)
          .eq('user_id', userId)
          .in('event_type', ['stock_change'])
          .order('event_date', { ascending: false });

        if (stockError) throw stockError;

        // Récupérer l'historique des favoris
        const { data: favoriteHistory, error: favoriteError } = await supabase
          .from('wine_history')
          .select(`
            id,
            event_type,
            event_date
          `)
          .eq('wine_id', wineId)
          .eq('user_id', userId)
          .in('event_type', ['favorited'])
          .order('event_date', { ascending: false });

        if (favoriteError) throw favoriteError;

        // Récupérer l'historique des ajouts/déplacements/suppressions
        const { data: actionHistory, error: actionError } = await supabase
          .from('wine_history')
          .select(`
            id,
            event_type,
            event_date
          `)
          .eq('wine_id', wineId)
          .eq('user_id', userId)
          .in('event_type', ['added', 'removed'])
          .order('event_date', { ascending: false });

        if (actionError) throw actionError;

        // Formater les événements
        const formatEvent = (event: any): FormattedHistoryEvent | null => {
          const date = new Date(event.event_date);
          const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

          let text = '';
          let type: FormattedHistoryEvent['type'] = 'add';

          switch (event.event_type) {
            case 'added':
              text = 'Ajouté à ma cave';
              type = 'add';
              break;
            case 'removed':
              text = 'Supprimé de ma cave';
              type = 'delete';
              break;
            case 'tasted':
              // Utiliser le rating de user_wine au lieu de wine_history
              const currentRating = userWineData?.rating || 0;
              const stars = '★'.repeat(currentRating) + '☆'.repeat(5 - currentRating);
              text = `Dégusté ${stars}`;
              type = 'taste';
              break;
            case 'stock_change':
              const previousAmount = event.previous_amount || 0;
              const newAmount = event.new_amount || 0;
              const difference = newAmount - previousAmount;
              
              if (difference > 0) {
                text = `${difference} bouteille${difference > 1 ? 's' : ''} ajoutée${difference > 1 ? 's' : ''}`;
                type = 'stock';
              } else if (difference < 0) {
                text = `${Math.abs(difference)} bouteille${Math.abs(difference) > 1 ? 's' : ''} consommée${Math.abs(difference) > 1 ? 's' : ''}`;
                type = 'stock';
              } else {
                // Si pas de changement, ne pas afficher cet événement
                return null;
              }
              break;
            case 'favorited':
              text = 'Ajouté aux favoris';
              type = 'favorite';
              break;
            case 'noted':
              // Ne pas afficher les notes dans l'historique
              return null;
            default:
              text = 'Événement inconnu';
          }

          return {
            id: event.id,
            date: formattedDate,
            text,
            type,
            eventDate: event.event_date
          };
        };

        // Combiner et trier tous les événements
        const allEvents = [
          ...(tasteHistory || []).map(formatEvent),
          ...(stockHistory || []).map(formatEvent),
          ...(favoriteHistory || []).map(formatEvent),
          ...(actionHistory || []).map(formatEvent)
        ]
        .filter(event => event !== null) // Filtrer les événements null
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

        // Agrégation des événements par date et type
        const aggregatedEvents: FormattedHistoryEvent[] = [];
        const eventsByDate = new Map<string, FormattedHistoryEvent[]>();

        // Grouper par date
        allEvents.forEach(event => {
          if (!event) return;
          const dateKey = event.date;
          if (!eventsByDate.has(dateKey)) {
            eventsByDate.set(dateKey, []);
          }
          eventsByDate.get(dateKey)!.push(event);
        });

        // Traiter chaque date
        eventsByDate.forEach((events, date) => {
          const stockEvents = events.filter(e => e.type === 'stock');
          const otherEvents = events.filter(e => e.type !== 'stock');

          // Agrégation des événements de stock
          if (stockEvents.length > 0) {
            const totalAdded = stockEvents
              .filter(e => e.text.includes('ajoutée'))
              .reduce((sum, e) => {
                const match = e.text.match(/(\d+)/);
                return sum + (match ? parseInt(match[1]) : 0);
              }, 0);
            
            const totalConsumed = stockEvents
              .filter(e => e.text.includes('consommée'))
              .reduce((sum, e) => {
                const match = e.text.match(/(\d+)/);
                return sum + (match ? parseInt(match[1]) : 0);
              }, 0);

            if (totalAdded > 0) {
              aggregatedEvents.push({
                id: `stock_add_${date}`,
                date,
                text: `${totalAdded} bouteille${totalAdded > 1 ? 's' : ''} ajoutée${totalAdded > 1 ? 's' : ''}`,
                type: 'stock',
                eventDate: events[0].eventDate
              });
            }

            if (totalConsumed > 0) {
              aggregatedEvents.push({
                id: `stock_consume_${date}`,
                date,
                text: `${totalConsumed} bouteille${totalConsumed > 1 ? 's' : ''} consommée${totalConsumed > 1 ? 's' : ''}`,
                type: 'stock',
                eventDate: events[0].eventDate
              });
            }
          }

          // Ajouter les autres événements (sans doublons)
          const uniqueOtherEvents = otherEvents.filter((event, index, self) => 
            index === self.findIndex(e => e.text === event.text)
          );
          aggregatedEvents.push(...uniqueOtherEvents);
        });

        // Trier par date décroissante
        const finalEvents = aggregatedEvents.sort((a, b) => 
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        );

        setHistory(finalEvents);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [wineId, userId]);

  return { history, loading };
}