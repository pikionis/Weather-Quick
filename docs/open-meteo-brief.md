# Brief: τι χρειαζόμαστε από το Open-Meteo

Για το Weather Quick χρειαζόμαστε 4 APIs του Open-Meteo, όλα χωρίς κλειδί.
Τα υπόλοιπα μένουν εκτός ή πάνε στο roadmap.

## Τα 4 APIs

| Για τι | API | Docs |
|---|---|---|
| Τώρα, επόμενες 7 μέρες, προηγούμενες 4 εβδομάδες | Weather Forecast (`https://api.open-meteo.com/v1/forecast`) | https://open-meteo.com/en/docs |
| Παλιές προγνώσεις σε σταθερό lead time, για το backtest | Previous Runs | https://open-meteo.com/en/docs/previous-runs-api |
| Η «αλήθεια» για το backtest | Historical Weather (ERA5) | https://open-meteo.com/en/docs/historical-weather-api |
| Αναζήτηση πόλης, για να πάρουμε συντεταγμένες | Geocoding | Στα docs, ενότητα Geocoding |

## 1. Weather Forecast: μία κλήση για τη βάση

- `latitude`, `longitude`: από το Geocoding.
- `current`: `temperature_2m`, `apparent_temperature`, `dew_point_2m`,
  `wind_speed_10m`, `wind_gusts_10m`, `wind_direction_10m`, `precipitation`,
  `weather_code`
- `hourly`: `temperature_2m`, `dew_point_2m`, `wind_speed_10m`,
  `wind_gusts_10m`, `wind_direction_10m`, `precipitation`,
  `precipitation_probability`
- `daily`: `temperature_2m_max`, `temperature_2m_min`, `wind_speed_10m_max`,
  `wind_gusts_10m_max`, `precipitation_sum`, `precipitation_probability_max`,
  `weather_code`
- `past_days=28` (έως 92) και `forecast_days=7` (έως 16): παρελθόν, τώρα και
  μέλλον σε μία κλήση.
- `timezone=auto`: υποχρεωτικό όταν ζητάς `daily`, και δίνει τοπική ώρα.
- `models`: το κλειδωμένο μοντέλο μας και 2-3 ακόμα (π.χ. ECMWF IFS 0.25°,
  NCEP GFS Seamless, DWD ICON Seamless). Τα ακριβή αναγνωριστικά τα παίρνεις
  από τα docs. Σε ένα πραγματικό δείγμα, έλεγξε πώς ονομάζονται οι μεταβλητές
  όταν ζητάς πολλά μοντέλα μαζί.
- Μονάδες: τα defaults είναι °C, km/h και mm. Κράτα τα και δείξε τα στο UI.

## 2. Previous Runs: για το backtest

- Οι ίδιες μεταβλητές με κατάληξη `_previous_day1` έως `_previous_day7`: η
  πρόγνωση που υπήρχε 1 έως 7 μέρες πριν.
- Μόνο το κλειδωμένο μοντέλο, για τις τελευταίες 90 μέρες.
- Ωριαία δεδομένα, που τα συγκεντρώνεις σε ημερήσια με την τοπική ώρα.

## 3. Historical Weather (ERA5): η «αλήθεια»

- Ζήτα `models=era5`. Χωρίς αυτό, το API απαντά με ECMWF IFS και όχι με ERA5.
- Ίδια ονόματα μεταβλητών και μονάδες με το Forecast API.
- Έρχεται με καθυστέρηση 7 ημερών: οι ώρες που δεν έχει ακόμα είναι `null`.
  Μια μέρα μπαίνει στο backtest μόνο με όλες τις 24 ώρες.
- Είναι reanalysis, όχι μέτρηση σταθμού. Γράψ' το στο NOTES.md.

## 4. Geocoding

- Όνομα πόλης, για να πάρεις `latitude` και `longitude`.

## Απόφαση για σένα

Για τις «προηγούμενες εβδομάδες» της βάσης υπάρχουν δύο δρόμοι:

- `past_days` του Forecast API: μία κλήση, χωρίς κενό στις πρόσφατες μέρες,
  αλλά είναι δεδομένα μοντέλου.
- ERA5: η ίδια πηγή με την «αλήθεια» του backtest, αλλά λείπουν οι πιο
  πρόσφατες μέρες.

Πρόταση: `past_days` για τη βάση, ERA5 για το backtest και το track record.
Γράψε την επιλογή σου στο NOTES.md.

## Παγίδες

- Η απάντηση χρησιμοποιεί ένα σταθερό `utc_offset_seconds` για όλο το εύρος.
  Αν το εύρος περνάει αλλαγή θερινής ώρας, έλεγξε τις ώρες γύρω από την αλλαγή.
- Λάθος παράμετροι επιστρέφουν HTTP 400 με `"error": true` και ένα `reason`.
  Δείξε το `reason` στο error state.
- Στην ανανέωση κάθε 10 λεπτά ξαναφέρνεις μόνο current και forecast. Το
  ιστορικό και το backtest τα φέρνεις μία φορά ανά φόρτωση της σελίδας.

## Όροι χρήσης

- Δωρεάν για μη εμπορική χρήση: λιγότερες από 10.000 κλήσεις τη μέρα, 5.000
  την ώρα και 600 το λεπτό.
- Τα δεδομένα έχουν άδεια CC BY 4.0, που θέλει αναφορά στην πηγή: βάλε
  «Weather data by Open-Meteo.com», με link, στο footer.

## Εκτός

Climate, Seasonal, Marine, Air Quality, Flood, Satellite Radiation, Elevation,
Historical Forecast και Single Runs δεν χρειάζονται για το brief της άσκησης.
Το Ensemble μόνο αν περισσέψει χρόνος, για να δείξει την αβεβαιότητα. Τα
υπόλοιπα πάνε στο roadmap αν τα χρειαστείς.
