-- =============================================================
-- SWEDISH FOOD DATABASE - Common foods with macros per 100g
-- Source: Livsmedelsverket (Swedish Food Agency) approximations
-- =============================================================

INSERT INTO public.foods (name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category) VALUES
-- PROTEIN SOURCES
('Chicken breast', 'Kycklingbröst', 110, 23.1, 0, 1.3, 'Protein'),
('Chicken thigh', 'Kycklinglår', 177, 18.5, 0, 11.2, 'Protein'),
('Salmon fillet', 'Laxfilé', 208, 20.4, 0, 13.6, 'Protein'),
('Cod fillet', 'Torskfilé', 82, 18.0, 0, 0.7, 'Protein'),
('Shrimp', 'Räkor', 99, 20.9, 0.2, 1.7, 'Protein'),
('Tuna canned', 'Tonfisk konserv', 116, 25.5, 0, 1.0, 'Protein'),
('Eggs whole', 'Ägg, hela', 143, 12.6, 0.7, 9.9, 'Protein'),
('Egg whites', 'Äggvita', 52, 10.9, 0.7, 0.2, 'Protein'),
('Ground beef 10%', 'Nötfärs 10%', 176, 20.0, 0, 10.0, 'Protein'),
('Ground beef 5%', 'Nötfärs 5%', 137, 21.0, 0, 5.5, 'Protein'),
('Turkey breast', 'Kalkonbröst', 104, 23.5, 0, 0.7, 'Protein'),
('Beef sirloin', 'Nötbiff entrecôte', 195, 21.0, 0, 12.0, 'Protein'),
('Pork tenderloin', 'Fläskfilé', 109, 21.0, 0, 2.5, 'Protein'),
('Cottage cheese 4%', 'Keso 4%', 98, 11.0, 3.5, 4.0, 'Protein'),
('Greek yogurt 2%', 'Grekisk yoghurt 2%', 73, 9.0, 4.0, 2.0, 'Protein'),
('Quark', 'Kvarg', 64, 12.0, 4.0, 0.3, 'Protein'),
('Skyr', 'Skyr', 63, 11.0, 4.0, 0.2, 'Protein'),

-- PROTEIN SUPPLEMENTS
('Whey protein', 'Vassleprotein', 380, 80.0, 6.0, 5.0, 'Kosttillskott'),
('Casein protein', 'Kaseinprotein', 370, 78.0, 4.0, 3.0, 'Kosttillskott'),
('SSN Isolate', 'SSN isolat (SSN)', 350, 85.0, 3.0, 1.0, 'Kosttillskott'),
('Protein bar', 'Proteinbar', 350, 30.0, 35.0, 12.0, 'Kosttillskott'),

-- CARBS / GRAINS
('Rice white cooked', 'Ris vitt kokt', 130, 2.7, 28.2, 0.3, 'Kolhydrater'),
('Rice brown cooked', 'Ris brunt kokt', 123, 2.6, 25.6, 1.0, 'Kolhydrater'),
('Pasta cooked', 'Pasta kokt', 157, 5.8, 30.6, 0.9, 'Kolhydrater'),
('Potato boiled', 'Potatis kokt', 77, 2.0, 17.0, 0.1, 'Kolhydrater'),
('Sweet potato', 'Sötpotatis', 86, 1.6, 20.1, 0.1, 'Kolhydrater'),
('Oatmeal', 'Havregryn', 372, 13.2, 58.7, 7.0, 'Kolhydrater'),
('Oat porridge cooked', 'Havregrynsgröt kokt', 71, 2.5, 12.0, 1.5, 'Kolhydrater'),
('Bread wholegrain', 'Bröd fullkorn', 246, 9.0, 42.0, 3.5, 'Kolhydrater'),
('Rice cakes', 'Majskakor', 392, 7.8, 82.0, 2.8, 'Kolhydrater'),
('Knäckebröd', 'Knäckebröd', 340, 10.0, 65.0, 2.5, 'Kolhydrater'),
('Tortilla wrap', 'Tortilla wrap', 312, 8.0, 52.0, 7.0, 'Kolhydrater'),
('Sourdough bread', 'Surdegsbröd', 265, 8.5, 50.0, 2.5, 'Kolhydrater'),
('Levain bread', 'Levain', 250, 8.0, 48.0, 2.0, 'Kolhydrater'),
('Pågen bread', 'Pågen bröd', 260, 9.0, 45.0, 3.5, 'Kolhydrater'),
('Couscous cooked', 'Couscous kokt', 112, 3.8, 23.2, 0.2, 'Kolhydrater'),
('Quinoa cooked', 'Quinoa kokt', 120, 4.4, 21.3, 1.9, 'Kolhydrater'),
('Bulgur cooked', 'Bulgur kokt', 83, 3.1, 18.6, 0.2, 'Kolhydrater'),

-- FATS
('Olive oil', 'Olivolja', 884, 0, 0, 100.0, 'Fett'),
('Coconut oil', 'Kokosolja', 862, 0, 0, 100.0, 'Fett'),
('Butter', 'Smör', 717, 0.9, 0.1, 81.1, 'Fett'),
('Avocado', 'Avokado', 160, 2.0, 8.5, 14.7, 'Fett'),
('Almonds', 'Mandlar', 579, 21.2, 21.7, 49.9, 'Fett'),
('Walnuts', 'Valnötter', 654, 15.2, 13.7, 65.2, 'Fett'),
('Peanut butter', 'Jordnötssmör', 588, 25.1, 20.0, 50.4, 'Fett'),
('Almond butter', 'Mandelsmör', 614, 21.0, 18.8, 55.5, 'Fett'),
('Chia seeds', 'Chiafrön', 486, 16.5, 42.1, 30.7, 'Fett'),
('Flaxseeds', 'Linfrön', 534, 18.3, 28.9, 42.2, 'Fett'),
('Almond milk unsweetened', 'Alpro mandelmjölk osötad', 13, 0.4, 0, 1.1, 'Mejeri'),
('Oat milk', 'Havremjölk', 46, 1.0, 6.7, 1.5, 'Mejeri'),

-- DAIRY
('Milk 1.5%', 'Mjölk 1.5%', 46, 3.4, 4.8, 1.5, 'Mejeri'),
('Milk 3%', 'Mjölk 3%', 60, 3.3, 4.7, 3.0, 'Mejeri'),
('Cheese 28%', 'Ost 28%', 356, 25.0, 0, 28.0, 'Mejeri'),
('Cream cheese', 'Färskost', 253, 5.5, 3.5, 24.5, 'Mejeri'),
('Mozzarella', 'Mozzarella', 280, 22.0, 2.2, 20.3, 'Mejeri'),
('Parmesan', 'Parmesan', 392, 35.8, 3.2, 25.8, 'Mejeri'),
('Yogurt natural 3%', 'Naturell yoghurt 3%', 61, 3.5, 4.7, 3.0, 'Mejeri'),

-- FRUITS
('Banana', 'Banan', 89, 1.1, 22.8, 0.3, 'Frukt'),
('Apple', 'Äpple', 52, 0.3, 13.8, 0.2, 'Frukt'),
('Blueberries', 'Blåbär', 57, 0.7, 14.5, 0.3, 'Frukt'),
('Strawberries', 'Jordgubbar', 33, 0.7, 7.7, 0.3, 'Frukt'),
('Raspberries', 'Hallon', 52, 1.2, 11.9, 0.7, 'Frukt'),
('Orange', 'Apelsin', 47, 0.9, 11.8, 0.1, 'Frukt'),
('Grapes', 'Vindruvor', 69, 0.7, 18.1, 0.2, 'Frukt'),
('Mango', 'Mango', 60, 0.8, 15.0, 0.4, 'Frukt'),
('Pineapple', 'Ananas', 50, 0.5, 13.1, 0.1, 'Frukt'),
('Dates', 'Dadlar', 277, 1.8, 75.0, 0.2, 'Frukt'),

-- VEGETABLES
('Broccoli', 'Broccoli', 34, 2.8, 6.6, 0.4, 'Grönsaker'),
('Spinach', 'Spenat', 23, 2.9, 3.6, 0.4, 'Grönsaker'),
('Tomato', 'Tomat', 18, 0.9, 3.9, 0.2, 'Grönsaker'),
('Cucumber', 'Gurka', 15, 0.7, 3.6, 0.1, 'Grönsaker'),
('Bell pepper', 'Paprika', 31, 1.0, 6.0, 0.3, 'Grönsaker'),
('Carrot', 'Morot', 41, 0.9, 9.6, 0.2, 'Grönsaker'),
('Onion', 'Lök', 40, 1.1, 9.3, 0.1, 'Grönsaker'),
('Garlic', 'Vitlök', 149, 6.4, 33.1, 0.5, 'Grönsaker'),
('Mushrooms', 'Champinjoner', 22, 3.1, 3.3, 0.3, 'Grönsaker'),
('Zucchini', 'Zucchini', 17, 1.2, 3.1, 0.3, 'Grönsaker'),
('Kale', 'Grönkål', 35, 3.3, 4.4, 0.7, 'Grönsaker'),
('Lettuce', 'Sallad', 15, 1.4, 2.9, 0.2, 'Grönsaker'),
('Corn', 'Majs', 86, 3.3, 19.0, 1.2, 'Grönsaker'),
('Edamame', 'Edamame', 121, 11.9, 8.6, 5.2, 'Grönsaker'),
('Chickpeas cooked', 'Kikärtor kokta', 164, 8.9, 27.4, 2.6, 'Baljväxter'),
('Black beans cooked', 'Svarta bönor kokta', 132, 8.9, 23.7, 0.5, 'Baljväxter'),
('Lentils cooked', 'Linser kokta', 116, 9.0, 20.1, 0.4, 'Baljväxter'),

-- SAUCES & CONDIMENTS
('Soy sauce', 'Sojasås', 53, 8.1, 4.9, 0, 'Kryddor'),
('Ketchup', 'Ketchup', 112, 1.0, 27.4, 0.1, 'Kryddor'),
('Mustard', 'Senap', 66, 4.4, 5.3, 3.3, 'Kryddor'),
('Honey', 'Honung', 304, 0.3, 82.4, 0, 'Kryddor'),
('Jam', 'Sylt', 250, 0.4, 62.0, 0.1, 'Kryddor'),

-- BEVERAGES & OTHER
('Protein pudding', 'Proteinpudding', 80, 10.0, 7.0, 1.5, 'Kosttillskott'),
('Rice milk', 'Rismjölk', 49, 0.3, 9.2, 1.0, 'Mejeri'),
('Coconut milk canned', 'Kokosmjölk konserv', 197, 2.3, 2.8, 21.3, 'Mejeri'),
('Dark chocolate 70%', 'Mörk choklad 70%', 598, 7.8, 45.9, 42.6, 'Övrigt'),
('Peanuts', 'Jordnötter', 567, 25.8, 16.1, 49.2, 'Fett'),
('Cashews', 'Cashewnötter', 553, 18.2, 30.2, 43.9, 'Fett'),
('Granola', 'Granola', 471, 10.5, 64.4, 19.1, 'Kolhydrater'),
('Müsli', 'Müsli', 367, 9.7, 66.2, 6.1, 'Kolhydrater'),
('Crispbread Wasa', 'Wasa knäckebröd', 330, 11.0, 61.0, 2.5, 'Kolhydrater');
