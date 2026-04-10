-- Migration: Import Zenfit recipes
-- Imports 58 new food items and 71 recipes with ingredients from Zenfit extraction
-- Skips duplicate recipes #25, #38, #39, #43

DO $$
DECLARE
  v_coach_id UUID;
  v_recipe_id UUID;
BEGIN

  -- Look up the coach
  SELECT id INTO v_coach_id FROM public.profiles WHERE role = 'coach' LIMIT 1;

  -- ============================================================
  -- PHASE 1: Insert 58 new food items
  -- These ingredients do NOT have an exact name_sv match in foods
  -- ============================================================

  INSERT INTO public.foods (name, name_sv, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category) VALUES
  ('Butter, salted', 'Smör, saltat', 720, 0.9, 0.1, 81.0, 'Fett'),
  ('Levain sourdough (Pagen)', 'Levain, surdegsbröd (Pågen)', 228, 8.0, 45.0, 1.8, 'Kolhydrater'),
  ('Egg whites, pasteurized', 'Äggvita, pastöriserad', 45, 10.5, 0.7, 0, 'Protein'),
  ('Turkey deli slices', 'Kalkonpålägg', 108, 20.0, 1.0, 2.7, 'Protein'),
  ('Quark, natural, 0.2% fat', 'Kvarg, naturell, 0.2% fett', 60, 11.0, 4.0, 0.2, 'Mejeri'),
  ('Mini cottage cheese, 0.2% fat', 'Supermini Keso, 0.2% fett', 67, 13.3, 3.0, 0.2, 'Mejeri'),
  ('Blackcurrant jelly', 'Svartvinbärsgelé', 250, 0.2, 62.0, 0.1, 'Kryddor'),
  ('ATRON Isolate protein powder', 'ATRON Isolate Proteinpulver', 370, 87.0, 4.0, 1.0, 'Kosttillskott'),
  ('Peanut butter, 99%+ peanuts', 'Jordnötssmör, minst 99%', 588, 25.1, 20.0, 50.4, 'Fett'),
  ('Whey Berry protein (Cyprus)', 'Whey Berry - Cypern', 372, 75.0, 8.0, 4.0, 'Kosttillskott'),
  ('Granola, Cocoa and Raspberry', 'Granola, Kakao & Hallon', 380, 8.0, 65.0, 9.0, 'Kolhydrater'),
  ('Annie Yoghurt', 'Annie Yoghurt', 70, 4.0, 9.0, 2.0, 'Mejeri'),
  ('Cottage cheese/oat bread', 'keso/ havregryn bröd', 170, 8.0, 28.0, 3.0, 'Kolhydrater'),
  ('Chicken breast fillet, raw', 'Kycklingbröstfilé, rå', 104, 23.0, 0, 1.2, 'Protein'),
  ('Carrots', 'Morötter', 44, 0.9, 9.6, 0.2, 'Grönsaker'),
  ('Iceberg lettuce', 'Isbergssallad', 18, 1.2, 2.9, 0.2, 'Grönsaker'),
  ('Zucchini/Squash', 'Zucchini/Squash', 21, 1.2, 3.5, 0.3, 'Grönsaker'),
  ('Casein powder, vanilla', 'Kaseinpulver, vaniljsmak', 355, 78.0, 4.0, 3.0, 'Kosttillskott'),
  ('Raspberries, frozen', 'Hallon, frysta', 28, 1.0, 5.5, 0.3, 'Frukt'),
  ('Carbs (IGNITE ATRON)', 'Kolhydrater (IGNITE ATRON)', 340, 0, 85.0, 0, 'Kosttillskott'),
  ('FINAL - ATRON supplement', 'FINAL - ATRON', 330, 40.0, 42.5, 0, 'Kosttillskott'),
  ('Cream cheese, Philadelphia', 'Färskost, Philadelphia Original', 223, 5.5, 3.5, 21.0, 'Mejeri'),
  ('Cold-smoked salmon', 'Kallrökt lax', 180, 21.0, 0, 11.0, 'Protein'),
  ('Rye bread rounds (Fazer)', 'Rågkusar 6P (Fazer)', 227, 8.0, 44.0, 1.5, 'Kolhydrater'),
  ('Oat drink, iKaffe (Oatly)', 'Havredryck, iKaffe (Oatly)', 58, 1.0, 6.5, 3.0, 'Mejeri'),
  ('Chocolate, 70%', 'Choklad, 70%', 567, 7.8, 42.0, 37.0, 'Övrigt'),
  ('Granola, Hazelnuts', 'Granola, Hasselnötter &...', 393, 9.0, 60.0, 13.0, 'Kolhydrater'),
  ('Cottage cheese 2.0%', 'Cottage Cheese 2,0%', 79, 12.0, 3.5, 2.0, 'Mejeri'),
  ('Blueberries, frozen', 'Blåbär, frysta', 57, 0.7, 14.5, 0.3, 'Frukt'),
  ('Cottage cheese 4%', 'Keso, 4%', 100, 11.0, 3.5, 4.0, 'Mejeri'),
  ('Avocado, fresh', 'Avokado, färsk', 164, 2.0, 8.5, 14.7, 'Fett'),
  ('Green beans/Haricots verts', 'Gröna bönor/Haricots verts', 37, 1.8, 7.0, 0.1, 'Grönsaker'),
  ('Potato', 'Potatis', 80, 2.0, 18.0, 0.1, 'Kolhydrater'),
  ('White rice, uncooked', 'Vitt ris, alla sorter, okokt', 364, 7.0, 82.0, 0.7, 'Kolhydrater'),
  ('Virgin coconut oil, cold-pressed', 'Virgin Kokosolja Kallpressad', 880, 0, 0, 97.8, 'Fett'),
  ('Salmon fillet (Pacific)', 'Laxfilé (Pacific brand)', 218, 20.0, 0, 15.3, 'Protein'),
  ('Baby spinach', 'Bladspenat', 30, 2.9, 3.6, 0.4, 'Grönsaker'),
  ('Grapefruit', 'Grapefrukt', 47, 0.7, 11.0, 0.1, 'Frukt'),
  ('Red bell pepper', 'Röd paprika', 34, 1.3, 6.5, 0.3, 'Grönsaker'),
  ('Ground beef, fine, 12% fat', 'Nötfärs, Finmalen, Fetthalt 12%', 184, 20.0, 0, 12.0, 'Protein'),
  ('Greek yogurt, 0% fat', 'Grekisk yoghurt, 0% fett', 59, 10.0, 4.75, 0, 'Mejeri'),
  ('Lemon', 'Citron', 33, 0.9, 7.0, 0.3, 'Frukt'),
  ('Almond drink, unsweetened', 'Mandeldryck, naturell, osötad', 13, 0.4, 0, 1.1, 'Mejeri'),
  ('Light milk, 0.5% lactose-free', 'Lättmjölk, 0.5% fett, laktosfri', 32, 3.5, 3.0, 0.5, 'Mejeri'),
  ('Ground beef, 3-7% fat, raw', 'Nötfärs, 3-7% fett, rå', 136, 21.0, 0, 5.8, 'Protein'),
  ('Medium milk, 1.5% lactose-free', 'Mellanmjölk, 1.5% fett, laktosfri', 47, 3.4, 4.8, 1.5, 'Mejeri'),
  ('Almond butter, 100% almonds', 'Mandelsmör, 100% mandlar', 620, 21.0, 18.8, 56.0, 'Fett'),
  ('Oats, Gyllenhammar brand', 'Havregryn, Gyllenhammar', 352, 13.0, 60.0, 6.0, 'Kolhydrater'),
  ('MCT oil', 'MCT olja', 880, 0, 0, 97.8, 'Fett'),
  ('Kimchi', 'Kimchi', 12, 1.5, 1.3, 0.2, 'Grönsaker'),
  ('Medium milk, 1.5% fat', 'Mellanmjölk, 1.5% fett', 48, 3.4, 4.8, 1.5, 'Mejeri'),
  ('Chicken breast, grilled/fried', 'Kycklingbröstfilé, grillad/stekt', 130, 25.0, 0, 3.3, 'Protein'),
  ('Low-fat cheese, 11% fat', 'Mager ost, 11% fett, valfri', 227, 32.0, 0, 11.0, 'Mejeri'),
  ('Mayonnaise (Hellmanns)', 'Majonnäs (Hellmann''s)', 705, 0.5, 1.0, 78.0, 'Kryddor'),
  ('Rice cake', 'Riskaka', 393, 7.0, 83.0, 2.5, 'Kolhydrater'),
  ('Tuna, in water, canned', 'Tonfisk, i vatten, konserverad', 109, 25.0, 0, 1.0, 'Protein'),
  ('Pollock, skinless', 'Sej/Alaska pollock, utan skinn', 78, 17.5, 0, 0.8, 'Protein'),
  ('Maxi Pack yogurt', 'Maxi Pack (yogur)', 58, 4.0, 7.0, 1.5, 'Mejeri');


  -- ============================================================
  -- PHASE 2: Insert recipes and recipe_ingredients
  -- 71 recipes (skipping #25, #38, #39, #43)
  -- ============================================================

  -- Recipe #1: Ägg
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Ägg', 'Ägg', 435, 40, 22, 20, ARRAY['Frukost', 'Mellanmål', 'Bodybuilding'], E'Rekommendation: Omega 3 + D+k2 enligt dosering', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Smör, saltat' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Levain, surdegsbröd (Pågen)' LIMIT 1), 42, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gurka' LIMIT 1), 50, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äggvita, pastöriserad' LIMIT 1), 150, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 165, 5);

  -- Recipe #2: Ägg på macka + GLASS
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Ägg på macka + GLASS', 'Ägg på macka + GLASS', 381, 41, 27, 12, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'25g ris-/ majskakor = 1 skiva (41g) Levain, surdegsbröd, Pågen', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majskakor' LIMIT 1), 25, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 30, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 110, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Alpro mandelmjölk osötad' LIMIT 1), 200, 4);

  -- Recipe #3: Ägg på majskakor
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Ägg på majskakor', 'Ägg på majskakor', 479, 35, 45, 17, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'25g ris-/ majskakor = 1 skiva (41g) Levain, surdegsbröd, Pågen\nRekommendation: Omega 3 + D+k2 enligt dosering', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majskakor' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kalkonpålägg' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 165, 3);

  -- Recipe #4: Ägg på majskakor
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Ägg på majskakor', 'Ägg på majskakor', 341, 36, 24, 11, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'25g ris-/ majskakor = 1 skiva (41g) Levain, surdegsbröd, Pågen\nKan äta 200g kvarg istället för äggvita', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majskakor' LIMIT 1), 25, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 110, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äggvita, pastöriserad' LIMIT 1), 200, 3);

  -- Recipe #5: Ägg på majskakor - Louise ägg
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Ägg på majskakor - Louise ägg', 'Ägg på majskakor - Louise ägg', 367, 32, 33, 11, ARRAY['Frukost', 'Mellanmål', 'Bodybuilding'], E'25g ris-/ majskakor = 1 skiva (41g) Levain, surdegsbröd, Pågen\nRekommendation: Omega 3 + D+k2 enligt dosering', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majskakor' LIMIT 1), 25, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äpple' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 110, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kvarg, naturell, 0.2% fett' LIMIT 1), 150, 4);

  -- Recipe #6: Ägg på majskakor + protein drink
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Ägg på majskakor + protein drink', 'Ägg på majskakor + protein drink', 336, 39, 19, 11, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Mixa en protein drink (TIPS: lite frysa is i eventuellt kaffe och kanel) + ät två ett på 15g ris-/eller majskakor', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majskakor' LIMIT 1), 20, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 30, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 110, 3);

  -- Recipe #7: Ägg på majskakor sanatana
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Ägg på majskakor sanatana', 'Ägg på majskakor sanatana', 404, 38, 36, 11, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'25g ris-/ majskakor = 1 skiva (41g) Levain, surdegsbröd, Pågen\nKeso 0,2% = Kvarg 0,2%', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majskakor' LIMIT 1), 35, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 110, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Supermini Keso, 0.2% fett' LIMIT 1), 170, 3);

  -- Recipe #8: Anna-Karina Special
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Anna-Karina Special', 'Anna-Karina Special', 305, 22, 26, 12, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], '-', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Svartvinbärsgelé' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'ATRON Isolate Proteinpulver' LIMIT 1), 15, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majskakor' LIMIT 1), 20, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Jordnötssmör, minst 99%' LIMIT 1), 25, 4);

  -- Recipe #9: Annie Mellanmål
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Annie Mellanmål', 'Annie Mellanmål', 420, 31, 34, 18, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], '-', 5, 5, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Whey Berry - Cypern' LIMIT 1), 25, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Granola, Kakao & Hallon' LIMIT 1), 40, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Annie Yoghurt' LIMIT 1), 250, 3);

  -- Recipe #10: Eget bröd med kalkon och ägg
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Eget bröd med kalkon och ägg', 'Eget bröd med kalkon och ägg', 479, 41, 47, 13, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'keso bröd = 100g = 1 st (av 12 bröd) (mini keso 0,2%)\n250 = 2 och en halv', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kalkonpålägg' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'keso/ havregryn bröd' LIMIT 1), 250, 2);

  -- Recipe #11: Enkel kycklingsallad
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Enkel kycklingsallad', 'Enkel kycklingsallad', 344, 34, 41, 4, ARRAY['Middag', 'Lunch', 'Enkla måltider', 'Sallad'], E'100g kyckling kan bytas mot = räkor, tonfisk eller annan mager proteinkälla\n\n1. Skär kycklingen i mindre bitar och krydda med salt och peppar. Värm upp en stekpanna med en skvätt vatten på medelhög värme och stek kycklingen i cirka 5-7 minuter tills köttet inte längre är rosa i mitten.\n2. Tillsätt vitlöken till pannan och stek tills den är gyllene. Krydda till sist kycklingen med lite oregano.\n3. Skölj alla grönsaker och häll av vätskan från majsen. Skär alla grönsaker i mindre bitar.\n4. Blanda grönsakerna och i en skål och toppa med kycklingen. Smaklig måltid!', 10, 10, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Tomat' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majs, konserverad' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gurka' LIMIT 1), 50, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kvarg, naturell, 0.2% fett' LIMIT 1), 75, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 100, 5),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Morötter' LIMIT 1), 100, 6),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äpple' LIMIT 1), 100, 7),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Isbergssallad' LIMIT 1), 250, 8);

  -- Recipe #12: Enkel kycklingsallad!
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Enkel kycklingsallad!', 'Enkel kycklingsallad!', 331, 29, 32, 9, ARRAY['Middag', 'Lunch', 'Enkla måltider', 'Sallad'], E'100g kyckling kan bytas mot = räkor, tonfisk eller annan mager proteinkälla\n\n1. Skär kycklingen i mindre bitar och krydda med salt och peppar. Värm upp en stekpanna med en skvätt vatten på medelhög värme och stek kycklingen i cirka 5-7 minuter tills köttet inte längre är rosa i mitten.\n2. Tillsätt vitlöken till pannan och stek tills den är gyllene. Krydda till sist kycklingen med lite oregano.\n3. Skölj alla grönsaker och häll av vätskan från majsen. Skär alla grönsaker i mindre bitar.\n4. Blanda grönsakerna och i en skål och toppa med kycklingen. Smaklig måltid!', 10, 10, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Olivolja' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Tomat' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majs, konserverad' LIMIT 1), 50, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gurka' LIMIT 1), 50, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Morötter' LIMIT 1), 75, 5),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äpple' LIMIT 1), 75, 6),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 120, 7),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Isbergssallad' LIMIT 1), 200, 8);

  -- Recipe #13: Enkel kycklingsallad.
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Enkel kycklingsallad.', 'Enkel kycklingsallad.', 445, 33, 34, 20, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Enkla måltider', 'Sallad'], E'Kyckling kan bytas mot = räkor, tonfisk eller annan mager proteinkälla\n15g olivolja = 75g avokado\nLAX = ta bort olivoljan och kycklingen', 10, 10, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Olivolja' LIMIT 1), 15, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majs, konserverad' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gurka' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Morötter' LIMIT 1), 100, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Zucchini/Squash' LIMIT 1), 100, 5),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Tomat' LIMIT 1), 100, 6),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 125, 7),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Isbergssallad' LIMIT 1), 250, 8);

  -- Recipe #14: Enkel kycklingsallad 150g
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Enkel kycklingsallad 150g', 'Enkel kycklingsallad 150g', 351, 35, 30, 10, ARRAY['Middag', 'Lunch', 'Enkla måltider', 'Sallad'], E'100g kyckling kan bytas mot = räkor, tonfisk eller annan mager proteinkälla\n\n1. Skär kycklingen i mindre bitar och krydda med salt och peppar. Värm upp en stekpanna med en skvätt vatten på medelhög värme och stek kycklingen i cirka 5-7 minuter tills köttet inte längre är rosa i mitten.\n2. Tillsätt vitlöken till pannan och stek tills den är gyllene. Krydda till sist kycklingen med lite oregano.\n3. Skölj alla grönsaker och häll av vätskan från majsen. Skär alla grönsaker i mindre bitar.\n4. Blanda grönsakerna och i en skål och toppa med kycklingen. Smaklig måltid!', 10, 10, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Olivolja' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majs, konserverad' LIMIT 1), 40, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äpple' LIMIT 1), 50, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Tomat' LIMIT 1), 50, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gurka' LIMIT 1), 50, 5),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Morötter' LIMIT 1), 75, 6),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 150, 7),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Isbergssallad' LIMIT 1), 250, 8);

  -- Recipe #15: Enkel kycklingsallad - Alicia
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Enkel kycklingsallad - Alicia', 'Enkel kycklingsallad - Alicia', 375, 30, 31, 14, ARRAY['Middag', 'Lunch', 'Enkla måltider', 'Sallad'], E'Kyckling kan bytas mot = räkor, tonfisk eller annan mager proteinkälla', 10, 10, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Olivolja' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majs, konserverad' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Tomat' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Morötter' LIMIT 1), 100, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gurka' LIMIT 1), 100, 5),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 120, 6),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Isbergssallad' LIMIT 1), 250, 7);

  -- Recipe #16: FLUFF
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'FLUFF', 'FLUFF', 240, 30, 10, 9, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'1. Vispa upp äggvitan (om önskat lite salt + någon droppe sötningsmedel)\n2. Vispa i kaseinet\n2. Vispa i hallonen\n2. Toppa med kanel och hackade nötter', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 15, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kaseinpulver, vaniljsmak' LIMIT 1), 20, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äggvita, pastöriserad' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon, frysta' LIMIT 1), 125, 4);

  -- Recipe #17: Frukt (kan ätas när som helst på dagen)
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Frukt (kan ätas när som helst på dagen)', 'Frukt (kan ätas när som helst på dagen)', 77, 0, 17, 0, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Valfri frukt circa 75 kcal', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äpple' LIMIT 1), 150, 1);

  -- Recipe #18: IW (Intra-Workout)
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'IW (Intra-Workout)', 'IW (Intra-Workout)', 134, 16, 17, 0, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Blandas ut i en full shaker och dricks direkt från passets start och ska vara klar innan passet är slut.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kolhydrater (IGNITE ATRON)' LIMIT 1), 20, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'FINAL - ATRON' LIMIT 1), 20, 2);

  -- Recipe #19: Jenny frukost
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Jenny frukost', 'Jenny frukost', 419, 24, 33, 21, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'Rekommendation: Omega-3 samt D-vitamin+K2 enligt dosering, tillsammans med övriga tillskott som Stefan rekommenderar.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Färskost, Philadelphia Original' LIMIT 1), 30, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kallrökt lax' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 55, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Rågkusar 6P (Fazer)' LIMIT 1), 56, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Havredryck, iKaffe (Oatly)' LIMIT 1), 100, 5);

  -- Recipe #20: Keso/ kvarg med frukt
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Keso/ kvarg med frukt', 'Keso/ kvarg med frukt', 297, 28, 28, 8, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Keso 0,2% = Kvarg 0,2%', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Choklad, 70%' LIMIT 1), 15, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äpple' LIMIT 1), 150, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Supermini Keso, 0.2% fett' LIMIT 1), 200, 3);

  -- Recipe #21: Keso med äpple
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Keso med äpple', 'Keso med äpple', 344, 24, 29, 14, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Bär: Valfria.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Granola, Hasselnötter &...' LIMIT 1), 15, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 15, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äpple' LIMIT 1), 150, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Cottage Cheese 2,0%' LIMIT 1), 150, 4);

  -- Recipe #22: Keso med bär
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Keso med bär', 'Keso med bär', 372, 37, 28, 12, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Bär: Valfria.\nKeso 0,2% = Kvarg 0,2%', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 20, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Blåbär, frysta' LIMIT 1), 150, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Supermini Keso, 0.2% fett' LIMIT 1), 250, 3);

  -- Recipe #23: Keso med bär
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Keso med bär', 'Keso med bär', 321, 39, 10, 14, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Bär: Valfria.\nAlt:Linfrön 10g = Chiafrön 12g', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Linfrön' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Keso, 4%' LIMIT 1), 250, 3);

  -- Recipe #24: Keso med bär - ANNY
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Keso med bär - ANNY', 'Keso med bär - ANNY', 335, 39, 12, 14, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Bär: Valfria.\nAlt:Linfrön 10g = Chiafrön 12g', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Linfrön' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon' LIMIT 1), 150, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Keso, 4%' LIMIT 1), 250, 3);

  -- SKIP #25 (duplicate of #24)

  -- Recipe #26: Kvarg med banan (ak)
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kvarg med banan (ak)', 'Kvarg med banan (ak)', 309, 24, 30, 10, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Keso 0,2% = Kvarg 0,2%', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Jordnötssmör, minst 99%' LIMIT 1), 20, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Banan' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kvarg, naturell, 0.2% fett' LIMIT 1), 150, 3);

  -- Recipe #27: Kvarg med bär
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kvarg med bär', 'Kvarg med bär', 362, 33, 38, 8, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Bär: Valfria.\nGranola eller musli med (380kcal/100g)\nKvarg valfri smak alt keso 0,2% fett', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Granola, Kakao & Hallon' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kvarg, naturell, 0.2% fett' LIMIT 1), 250, 3);

  -- Recipe #28: Kyckling Avokado Gröna bönor
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kyckling Avokado Gröna bönor', 'Kyckling Avokado Gröna bönor', 275, 33, 9, 12, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'3g avokado \u2248 1g sötmandlar (nötter)\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Avokado, färsk' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 150, 3);

  -- Recipe #29: Kyckling och Potatis
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kyckling och Potatis', 'Kyckling och Potatis', 288, 30, 12, 13, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n1g nötter = 3g avokado\n\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 20, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 120, 4);

  -- Recipe #30: Kyckling och Potatis
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kyckling och Potatis', 'Kyckling och Potatis', 362, 37, 27, 11, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n1g nötter = 3g avokado\n150g kyckling rå = 200g räkor\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 15, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 150, 4);

  -- Recipe #31: Kyckling och Potatis - matchar salladen
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kyckling och Potatis - matchar salladen', 'Kyckling och Potatis - matchar salladen', 351, 37, 30, 9, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n1g nötter = 3g avokado\n\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 150, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 150, 4);

  -- Recipe #32: Kyckling, ris och banan
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kyckling, ris och banan', 'Kyckling, ris och banan', 529, 34, 76, 9, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n1g nötter = 3g avokado 50g\n\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Vitt ris, alla sorter, okokt' LIMIT 1), 66, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Banan' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 125, 4);

  -- Recipe #33: Kyckling, ris och banan
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kyckling, ris och banan', 'Kyckling, ris och banan', 479, 36, 62, 9, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Virgin Kokosolja Kallpressad' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Banan' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ananas' LIMIT 1), 50, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Vitt ris, alla sorter, okokt' LIMIT 1), 55, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 150, 5);

  -- Recipe #34: Kyckling, ris och banan Tävling
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kyckling, ris och banan Tävling', 'Kyckling, ris och banan Tävling', 307, 23, 35, 8, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], '-', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Olivolja' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Vitt ris, alla sorter, okokt' LIMIT 1), 30, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Banan' LIMIT 1), 50, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 100, 4);

  -- Recipe #35: Kyckling, ris och banan- VILL HA
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Kyckling, ris och banan- VILL HA', 'Kyckling, ris och banan- VILL HA', 499, 32, 70, 9, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Virgin Kokosolja Kallpressad' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Banan' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ananas' LIMIT 1), 50, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Vitt ris, alla sorter, okokt' LIMIT 1), 66, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 130, 5);

  -- Recipe #36: Lax och Potatis
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Lax och Potatis', 'Lax och Potatis', 519, 36, 46, 21, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad\n\nAlternativ till LAX 125g:\n110 g Kyckling + 16g olivolja\n110 g Nötfärs 12% + 16 g sötmandel', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kvarg, naturell, 0.2% fett' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Laxfilé (Pacific brand)' LIMIT 1), 125, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 150, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 200, 4);

  -- Recipe #37: Lax och Potatis
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Lax och Potatis', 'Lax och Potatis', 540, 36, 51, 21, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad\n\nAlternativ till LAX 125g:\n110 g Kyckling + 16g olivolja\n110 g Nötfärs 12% + 16 g sötmandel', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kvarg, naturell, 0.2% fett' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Laxfilé (Pacific brand)' LIMIT 1), 125, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 250, 4);

  -- SKIP #38 (duplicate of #36)
  -- SKIP #39 (duplicate of #36)

  -- Recipe #40: Lax Spenat Grapefrukt
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Lax Spenat Grapefrukt', 'Lax Spenat Grapefrukt', 329, 25, 11, 20, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'30g spenat eller 50g Isbegsallad\nGrapefrukt kan bytas mot Apelsin', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Bladspenat' LIMIT 1), 30, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Grapefrukt' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Laxfilé (Pacific brand)' LIMIT 1), 125, 3);

  -- Recipe #41: LOUISE - GLASS
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'LOUISE - GLASS', 'LOUISE - GLASS', 321, 47, 19, 6, ARRAY['Frukost', 'Mellanmål'], '-', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kakaopulver' LIMIT 1), 10, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Honung' LIMIT 1), 10, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 25, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon, frysta' LIMIT 1), 75, 5),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Supermini Keso, 0.2% fett' LIMIT 1), 175, 6);

  -- Recipe #42: LOUISE - GLASS
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'LOUISE - GLASS', 'LOUISE - GLASS', 236, 33, 13, 5, ARRAY['Frukost', 'Mellanmål', 'Bodybuilding'], '-', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Honung' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 5, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kakaopulver' LIMIT 1), 10, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 20, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon, frysta' LIMIT 1), 75, 5),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Supermini Keso, 0.2% fett' LIMIT 1), 100, 6);

  -- SKIP #43 (duplicate of #41)

  -- Recipe #44: Måltid 1
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Måltid 1', 'Måltid 1', 445, 38, 45, 12, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'Rekommendation: Omgea-3, D3+K2\nBär: Valfri sort.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 30, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Havregryn' LIMIT 1), 45, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 55, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Blåbär, frysta' LIMIT 1), 100, 5);

  -- Recipe #45: Måltid 2
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Måltid 2', 'Måltid 2', 391, 29, 30, 17, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'50g Potatis/ Sötpotatis = 11g Ris/ pasta/ quinoa / bulgur (okokt)\n\nSpenat + Paprika kan bytas mot andra grönsaker med ca 30-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Röd paprika' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Bladspenat' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Nötfärs, Finmalen, Fetthalt 12%' LIMIT 1), 130, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 150, 4);

  -- Recipe #46: Måltid 2
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Måltid 2', 'Måltid 2', 520, 35, 51, 19, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis/ Sötpotatis = 11g Ris/ pasta/ quinoa / bulgur (okokt)\n\nGröna bönor kan bytas mot andra grönsaker med ca 30-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 100, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Nötfärs, Finmalen, Fetthalt 12%' LIMIT 1), 150, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 250, 3);

  -- Recipe #47: Måltid 2 (ägg efter träning)
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Måltid 2 (ägg efter träning)', 'Måltid 2 (ägg efter träning)', 561, 32, 66, 18, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'Rekommendation: Omega-3 + D3+K2\n41g Levain, surdegsbröd = 25g ris-/ majskakor\n120g = circa 3 skivor', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ananas' LIMIT 1), 100, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Levain, surdegsbröd (Pågen)' LIMIT 1), 120, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 165, 3);

  -- Recipe #48: Måltid 3
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Måltid 3', 'Måltid 3', 349, 31, 41, 6, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'Bär: Valfri sort.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 30, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Havregryn' LIMIT 1), 40, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Blåbär, frysta' LIMIT 1), 100, 4);

  -- Recipe #49: Måltid 4
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Måltid 4', 'Måltid 4', 542, 42, 59, 15, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis/ Sötpotatis = 11g Ris/ pasta/ quinoa / bulgur (okokt)\n\nGröna bönor kan bytas mot andra grönsaker med ca 30-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 20, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 150, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 150, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 250, 4);

  -- Recipe #50: Måltid 4
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Måltid 4', 'Måltid 4', 333, 34, 40, 4, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'50g Potatis/ Sötpotatis = 11g Ris/ pasta/ quinoa / bulgur (okokt)\n\nGröna bönor kan bytas mot andra grönsaker med ca 30-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 140, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 150, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 150, 3);

  -- Recipe #51: Måltid 4 (efter träning)
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Måltid 4 (efter träning)', 'Måltid 4 (efter träning)', 300, 34, 32, 4, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'50g Potatis/ Sötpotatis = 11g Ris/ pasta/ quinoa / bulgur (okokt)', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 100, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, rå' LIMIT 1), 140, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 200, 3);

  -- Recipe #52: Middag
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Middag', 'Middag', 529, 38, 60, 14, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'50g Potatis/ Sötpotatis = 11g Ris/ pasta/ quinoa / bulgur (okokt)\n\nSpenat + Paprika kan bytas mot andra grönsaker med ca 30-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Grekisk yoghurt, 0% fett' LIMIT 1), 100, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Nötfärs, Finmalen, Fetthalt 12%' LIMIT 1), 110, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 150, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 250, 4);

  -- Recipe #53: Morgondrink
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Morgondrink', 'Morgondrink', 5, 0, 1, 0, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'(inget måste, men testa gärna och drick circa 20min innan frukost)\n1/2 pressad citron\n15g äppelcidervinäger\n10g glutamin\n0,5 liter vatten\n5 g kreatin\nca 20min innan fösta måltiden\n\nAlla måltider under dagen saltas med Himalayasalt, Keltiskt havssalt eller Red Moon real salt\nDrick med fördel minst 3 liter/dag\n\nRekommendation: Vitaminer & Mineraler\nMorgon: Omega-3 + D3/K2 enligt dosering\nKväll: Magnesium + Zink', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Citron' LIMIT 1), 15, 1);

  -- Recipe #54: NINJA GLASS
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'NINJA GLASS', 'NINJA GLASS', 248, 30, 7, 11, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'Mia Njut', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 15, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 30, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon, frysta' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Mandeldryck, naturell, osötad' LIMIT 1), 200, 4);

  -- Recipe #55: NINJA GLASS.
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'NINJA GLASS.', 'NINJA GLASS.', 357, 35, 15, 17, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], E'Mia Njut', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 25, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 30, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon, frysta' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Lättmjölk, 0.5% fett, laktosfri' LIMIT 1), 200, 4);

  -- Recipe #56: Nötfärs och potatis
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Nötfärs och potatis', 'Nötfärs och potatis', 570, 41, 58, 19, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Nötfärs circa 5% = med samma mängd kyckling, magert kött:\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\n50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n\nOlivolja extra virgin att ringla över salladen!!!', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Olivolja' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Nötfärs, 3-7% fett, rå' LIMIT 1), 150, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 300, 4);

  -- Recipe #57: Nötfärs och potatis
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Nötfärs och potatis', 'Nötfärs och potatis', 327, 38, 24, 8, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Nötfärs circa 5% = med samma mängd kyckling, magert kött:\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\n50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Bladspenat' LIMIT 1), 30, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Röd paprika' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Potatis' LIMIT 1), 75, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 100, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Nötfärs, 3-7% fett, rå' LIMIT 1), 150, 5);

  -- Recipe #58: Nötfärs och Ris
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Nötfärs och Ris', 'Nötfärs och Ris', 467, 30, 50, 16, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Vitt ris, alla sorter, okokt' LIMIT 1), 55, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Nötfärs, Finmalen, Fetthalt 12%' LIMIT 1), 125, 3);

  -- Recipe #59: Nötfärs, Ris, Paprika, Spenat
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Nötfärs, Ris, Paprika, Spenat', 'Nötfärs, Ris, Paprika, Spenat', 471, 31, 48, 17, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'50g Potatis = 11 g av pasta/ quinoa / bulgur/ ris\n\nHaricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Bladspenat' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Röd paprika' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Vitt ris, alla sorter, okokt' LIMIT 1), 55, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Nötfärs, Finmalen, Fetthalt 12%' LIMIT 1), 130, 4);

  -- Recipe #60: Pina Colada
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Piña Colada', 'Piña Colada', 558, 35, 67, 16, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål'], '-', 10, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Virgin Kokosolja Kallpressad' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'ATRON Isolate Proteinpulver' LIMIT 1), 25, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Havregryn' LIMIT 1), 30, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ananas' LIMIT 1), 100, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Banan' LIMIT 1), 120, 5),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Mellanmjölk, 1.5% fett, laktosfri' LIMIT 1), 200, 6);

  -- Recipe #61: Proteingröt
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Proteingröt', 'Proteingröt', 443, 27, 40, 19, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], '-', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Virgin Kokosolja Kallpressad' LIMIT 1), 15, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'ATRON Isolate Proteinpulver' LIMIT 1), 20, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Havregryn' LIMIT 1), 60, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon, frysta' LIMIT 1), 100, 4);

  -- Recipe #62: Proteingröt
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Proteingröt', 'Proteingröt', 307, 15, 40, 9, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Bär: Valfria.\nAlternativ: Om du vill ha kvarg istället för 35g proteinpulver, tar du bort 10 g havregryn och proteinpulvret, och äter istället 250 g kvarg 0,2%.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Virgin Kokosolja Kallpressad' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 10, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Havregryn' LIMIT 1), 50, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Blåbär' LIMIT 1), 100, 4);

  -- Recipe #63: Proteingröt A
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Proteingröt A', 'Proteingröt A', 322, 33, 28, 8, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Alternativ: Om du vill ha kvarg istället för proteinpulver, tar du bort 10 g havregryn och proteinpulvret, och äter istället 250 g kvarg 0,2%.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Virgin Kokosolja Kallpressad' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'ATRON Isolate Proteinpulver' LIMIT 1), 30, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Havregryn' LIMIT 1), 40, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon, frysta' LIMIT 1), 100, 4);

  -- Recipe #64: Proteingröt LAILA
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Proteingröt LAILA', 'Proteingröt LAILA', 435, 39, 35, 15, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Bär: 30 kcal / 100g.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Mandelsmör, 100% mandlar' LIMIT 1), 10, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'ATRON Isolate Proteinpulver' LIMIT 1), 25, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Havregryn, Gyllenhammar' LIMIT 1), 50, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 55, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon, frysta' LIMIT 1), 100, 5);

  -- Recipe #65: Proteinshake
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Proteinshake', 'Proteinshake', 131, 20, 0, 5, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], '-', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'MCT olja' LIMIT 1), 5, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 25, 2);

  -- Recipe #66: Ris, Ägg, Kimchi + Frukt
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Ris, Ägg, Kimchi + Frukt', 'Ris, Ägg, Kimchi + Frukt', 537, 27, 68, 17, ARRAY['Frukost', 'Mellanmål', 'Fingermat', 'Frukost i skål', 'Smörgås/Wrap'], E'Välj en valfri frukt', 5, 10, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Vitt ris, alla sorter, okokt' LIMIT 1), 50, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kimchi' LIMIT 1), 50, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Banan' LIMIT 1), 120, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 165, 4);

  -- Recipe #67: Toast Ägg Kalkon Avokado
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Toast Ägg Kalkon Avokado', 'Toast Ägg Kalkon Avokado', 405, 22, 37, 18, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'41g Levain, surdegsbröd = 25g ris-/ majskakor\nValfritt magert pålägg (alt: 50g pålägg = 15g isolat)\nRekommendation: Omega 3 + D+k2 enligt dosering', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Avokado, färsk' LIMIT 1), 40, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Levain, surdegsbröd (Pågen)' LIMIT 1), 82, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 110, 3);

  -- Recipe #68: Toast Ägg Kalkon Avokado Grape
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Toast Ägg Kalkon Avokado Grape', 'Toast Ägg Kalkon Avokado Grape', 504, 34, 44, 21, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'41g Levain, surdegsbröd = 25g ris-/ majskakor\nValfritt magert pålägg (alt: 50g pålägg = 15g isolat)\nRekommendation: Omega 3 + D+k2 enligt dosering', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Bladspenat' LIMIT 1), 30, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kalkonpålägg' LIMIT 1), 40, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Avokado, färsk' LIMIT 1), 40, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Levain, surdegsbröd (Pågen)' LIMIT 1), 61, 4),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Grapefrukt' LIMIT 1), 100, 5),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Mellanmjölk, 1.5% fett' LIMIT 1), 100, 6),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Ägg, hela' LIMIT 1), 110, 7);

  -- Recipe #69: Toast med ost
  -- NOTE: Ingredient "Levain surdegsbröd, Pågen" mapped to 'Levain, surdegsbröd (Pågen)'
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Toast med ost', 'Toast med ost', 281, 21, 36, 6, ARRAY['Frukost', 'Lunch', 'Mellanmål', 'Ingen tillagning', 'Smörgås/Wrap', 'Växtbaserade/Vegetariska måltider'], E'1. Rosta eventuellt brödet och toppa sedan med osten.', 5, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kycklingbröstfilé, grillad/stekt' LIMIT 1), 20, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Mager ost, 11% fett, valfri' LIMIT 1), 30, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Levain, surdegsbröd (Pågen)' LIMIT 1), 81, 3);

  -- Recipe #70: Tonfisk & riskaka
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Tonfisk & riskaka', 'Tonfisk & riskaka', 509, 30, 53, 19, ARRAY['Frukost', 'Mellanmål'], '-', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Majonnäs (Hellmann''s)' LIMIT 1), 20, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Riskaka' LIMIT 1), 60, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Tomat' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Tonfisk, i vatten, konserverad' LIMIT 1), 100, 4);

  -- Recipe #71: Vitfisk Gröna bönor Olivolja
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Vitfisk Gröna bönor Olivolja', 'Vitfisk Gröna bönor Olivolja', 216, 28, 7, 8, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Haricots verts kan bytas mot andra grönsaker med ca 35-40 kcal/ 100g ex morot eller andra frys mixar\nAlt en sallad med: 50g gurka + 50g tomat + 50-100g sallad', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Olivolja' LIMIT 1), 7, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Gröna bönor/Haricots verts' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sej/Alaska pollock, utan skinn' LIMIT 1), 150, 3);

  -- Recipe #72: Vitfisk Spenat Grapefrukt
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Vitfisk Spenat Grapefrukt', 'Vitfisk Spenat Grapefrukt', 172, 27, 11, 2, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'30g spenat eller 50g Isbegsallad\nGrapefrukt kan bytas mot Apelsin', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Bladspenat' LIMIT 1), 30, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Grapefrukt' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sej/Alaska pollock, utan skinn' LIMIT 1), 150, 3);

  -- Recipe #73: Yoghurt, havregryn, isolat och bär
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Yoghurt, havregryn, isolat och bär', 'Yoghurt, havregryn, isolat och bär', 357, 36, 38, 6, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'250g 0,2% Keso = 250g kvarg 0,2% fett = 30g isolat', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'ATRON Isolate Proteinpulver' LIMIT 1), 20, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Havregryn' LIMIT 1), 40, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon, frysta' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Maxi Pack (yogur)' LIMIT 1), 200, 4);

  -- Recipe #74: Yoghurt, isolat, bär nötter - Sverige
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Yoghurt, isolat, bär nötter - Sverige', 'Yoghurt, isolat, bär nötter - Sverige', 352, 37, 24, 11, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Bär: Valfria.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 20, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Äpple' LIMIT 1), 100, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Kvarg, naturell, 0.2% fett' LIMIT 1), 300, 3);

  -- Recipe #75: Yoghurt, isolat, bär nötter - TINA
  INSERT INTO public.recipes (coach_id, name, name_sv, total_calories, total_protein, total_carbs, total_fat, tags, instructions, prep_time_minutes, cook_time_minutes, servings)
  VALUES (v_coach_id, 'Yoghurt, isolat, bär nötter - TINA', 'Yoghurt, isolat, bär nötter - TINA', 361, 38, 21, 14, ARRAY['Frukost', 'Middag', 'Lunch', 'Mellanmål', 'Bodybuilding'], E'Bär: Valfria.', 0, 0, 1)
  RETURNING id INTO v_recipe_id;
  INSERT INTO public.recipe_ingredients (recipe_id, food_id, amount_g, sort_order) VALUES
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Sötmandel' LIMIT 1), 15, 1),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'SSN isolat (SSN)' LIMIT 1), 20, 2),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Hallon' LIMIT 1), 100, 3),
  (v_recipe_id, (SELECT id FROM public.foods WHERE name_sv = 'Maxi Pack (yogur)' LIMIT 1), 300, 4);

END $$;
