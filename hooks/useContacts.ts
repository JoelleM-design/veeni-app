import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ContactUser {
  id: string;
  first_name: string;
  email: string;
  avatar?: string;
  isContact: boolean;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');

  // Vérifier la permission des contacts
  const checkPermission = async () => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (err) {
      console.error('Erreur lors de la vérification des permissions contacts:', err);
      setError('Erreur lors de la vérification des permissions');
      return false;
    }
  };

  // Demander la permission des contacts
  const requestPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (err) {
      console.error('Erreur lors de la demande de permission contacts:', err);
      setError('Erreur lors de la demande de permission');
      return false;
    }
  };

  // Charger les contacts et les utilisateurs Veeni correspondants
  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const hasPermission = await checkPermission();
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      // Récupérer tous les contacts
      const { data: contactsData } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Emails,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
        ],
      });

      if (!contactsData || contactsData.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }

      // Extraire les emails des contacts
      const contactEmails = contactsData
        .filter(contact => contact.emails && contact.emails.length > 0)
        .map(contact => ({
          email: contact.emails![0].email,
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
        }));

      // Récupérer les utilisateurs Veeni correspondants
      const { data: veeniUsers, error: veeniError } = await supabase
        .from('User')
        .select('id, first_name, email, avatar')
        .in('email', contactEmails.map(c => c.email));

      if (veeniError) {
        console.error('Erreur lors de la récupération des utilisateurs Veeni:', veeniError);
        setError('Erreur lors de la récupération des utilisateurs');
        setLoading(false);
        return;
      }

      // Combiner les contacts avec les utilisateurs Veeni
      const contactUsers: ContactUser[] = contactEmails
        .map(contact => {
          const veeniUser = veeniUsers?.find(user => user.email === contact.email);
          return {
            id: veeniUser?.id || contact.email,
            first_name: veeniUser?.first_name || contact.firstName || 'Contact',
            email: contact.email,
            avatar: veeniUser?.avatar,
            isContact: !!veeniUser,
          };
        })
        .filter(contact => contact.isContact); // Ne garder que les contacts qui sont sur Veeni

      setContacts(contactUsers);
    } catch (err) {
      console.error('Erreur lors du chargement des contacts:', err);
      setError('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return {
    contacts,
    loading,
    error,
    permissionStatus,
    requestPermission,
    refreshContacts: loadContacts,
  };
}; 