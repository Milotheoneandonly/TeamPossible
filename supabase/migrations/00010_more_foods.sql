-- More specific foods, drinks, and ingredients
INSERT INTO public.foods (name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category) VALUES
-- NUTS & SEEDS (specific)
('Sweet almonds', 'Sötmandel', 579, 21.2, 21.7, 49.9, 'Fett'),
('Pumpkin seeds', 'Pumpafrön', 559, 30.2, 10.7, 49.1, 'Fett'),
('Sunflower seeds', 'Solrosfrön', 584, 20.8, 20.0, 51.5, 'Fett'),
('Sesame seeds', 'Sesamfrön', 573, 17.7, 23.5, 49.7, 'Fett'),
('Hemp seeds', 'Hampafrön', 553, 31.6, 8.7, 48.8, 'Fett'),
('Macadamia nuts', 'Macadamianötter', 718, 7.9, 13.8, 75.8, 'Fett'),
('Pistachios', 'Pistagenötter', 560, 20.2, 27.2, 45.3, 'Fett'),
('Hazelnuts', 'Hasselnötter', 628, 15.0, 16.7, 60.8, 'Fett'),
('Brazil nuts', 'Paranötter', 656, 14.3, 12.3, 66.4, 'Fett'),
('Pine nuts', 'Pinjenötter', 673, 13.7, 13.1, 68.4, 'Fett'),

-- DRINKS
('Apple cider vinegar', 'Äppelcidervinäger', 21, 0, 0.9, 0, 'Dryck'),
('Kombucha', 'Kombucha', 17, 0, 4.0, 0, 'Dryck'),
('Coconut water', 'Kokosvatten', 19, 0.7, 3.7, 0.2, 'Dryck'),
('Orange juice', 'Apelsinjuice', 45, 0.7, 10.4, 0.2, 'Dryck'),
('Protein shake mixed', 'Proteinshake blandad', 80, 15.0, 5.0, 1.0, 'Dryck'),
('BCAA drink', 'BCAA dryck', 10, 2.5, 0, 0, 'Dryck'),
('Energy drink sugar free', 'Energidryck sockerfri', 5, 0, 0, 0, 'Dryck'),
('Green tea', 'Grönt te', 1, 0, 0, 0, 'Dryck'),
('Coffee black', 'Kaffe svart', 2, 0.1, 0, 0, 'Dryck'),
('Aloe vera juice', 'Aloe vera juice', 8, 0, 2.0, 0, 'Dryck'),

-- MORE DAIRY SPECIFIC
('Yogurt Arla Protein', 'Arla Protein yoghurt', 56, 10.0, 4.0, 0.3, 'Mejeri'),
('Kvarg Lindahls', 'Lindahls kvarg', 64, 12.0, 4.0, 0.3, 'Mejeri'),
('Milk Oatly Barista', 'Oatly Barista havredryck', 59, 1.0, 6.5, 3.0, 'Mejeri'),
('Cream cheese light', 'Färskost lätt', 115, 7.0, 4.0, 7.5, 'Mejeri'),
('Ricotta', 'Ricotta', 174, 11.3, 3.0, 13.0, 'Mejeri'),

-- MORE PROTEIN
('Protein pancake mix', 'Proteinpannkaksmix', 350, 40.0, 35.0, 5.0, 'Kosttillskott'),
('Creatine monohydrate', 'Kreatin monohydrat', 0, 0, 0, 0, 'Kosttillskott'),
('Fish oil capsule', 'Fiskolja kapsel', 900, 0, 0, 100.0, 'Kosttillskott'),
('Collagen powder', 'Kollagenpulver', 350, 90.0, 0, 0, 'Kosttillskott'),

-- MORE CARBS
('Sweet potato fries baked', 'Sötpotatispommes ugn', 130, 1.5, 25.0, 3.5, 'Kolhydrater'),
('Jasmine rice cooked', 'Jasminris kokt', 135, 2.7, 30.0, 0.3, 'Kolhydrater'),
('Basmati rice cooked', 'Basmatiris kokt', 121, 3.5, 25.2, 0.4, 'Kolhydrater'),
('Wraps whole wheat', 'Wraps fullkorn', 295, 9.0, 48.0, 6.5, 'Kolhydrater'),
('Rye bread dark', 'Mörkt rågbröd', 240, 8.5, 46.0, 1.3, 'Kolhydrater'),
('Crisp bread Wasa Husman', 'Wasa Husman', 310, 10.0, 60.0, 1.5, 'Kolhydrater'),

-- SAUCES & DRESSINGS
('Mayo light', 'Majonnäs lätt', 260, 0.5, 5.0, 26.0, 'Kryddor'),
('Hummus', 'Hummus', 166, 7.9, 14.3, 9.6, 'Kryddor'),
('Guacamole', 'Guacamole', 160, 2.0, 8.6, 14.2, 'Kryddor'),
('Pesto basil', 'Pesto basilika', 387, 6.0, 5.0, 37.0, 'Kryddor'),
('Tzatziki', 'Tzatziki', 52, 3.5, 3.0, 3.0, 'Kryddor'),
('Sweet chili sauce', 'Sweet chilisås', 220, 0.5, 54.0, 0.3, 'Kryddor'),
('BBQ sauce', 'BBQ sås', 172, 1.0, 40.0, 0.5, 'Kryddor'),
('Tabasco', 'Tabasco', 12, 0.8, 1.5, 0.4, 'Kryddor'),
('Worcestershire sauce', 'Worcestershiresås', 78, 0, 19.0, 0, 'Kryddor'),

-- FROZEN / READY MEALS
('Frozen berries mix', 'Frysta bär mix', 48, 0.8, 11.0, 0.3, 'Frukt'),
('Frozen mango', 'Fryst mango', 60, 0.8, 15.0, 0.4, 'Frukt'),
('Frozen spinach', 'Fryst spenat', 23, 2.9, 3.6, 0.4, 'Grönsaker'),
('Frozen broccoli', 'Fryst broccoli', 34, 2.8, 6.6, 0.4, 'Grönsaker'),
('Frozen edamame', 'Frysta edamamebönor', 121, 11.9, 8.6, 5.2, 'Grönsaker');
