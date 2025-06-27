import vivinoData from '../assets/data/brazilian_wine_data.json';

export function enrichWineData(ocrData: any) {
  // Recherche par nom (et millésime si dispo)
  const match = vivinoData.find((vin: any) =>
    vin.name && ocrData.name &&
    vin.name.toLowerCase().includes(ocrData.name.toLowerCase()) &&
    (!ocrData.year || vin.year === ocrData.year)
  );
  if (match) {
    return {
      ...ocrData,
      region: match.region || ocrData.region,
      producer: match.producer || ocrData.producer,
      grapes: match.grapes || ocrData.grapes,
      country: match.country || ocrData.country,
      price: match.price || ocrData.price,
      rating: match.rating || ocrData.rating,
      // Ajoute d'autres champs si besoin
    };
  }
  return ocrData;
} 