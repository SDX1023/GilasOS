-- Cleanup duplicate custom_decks (keep the one with most cards per title)
WITH ranked AS (
  SELECT id, title, 
    (SELECT count(*) FROM custom_deck_cards WHERE deck_id = custom_decks.id) as card_count,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim(title)), user_id 
      ORDER BY (SELECT count(*) FROM custom_deck_cards WHERE deck_id = custom_decks.id) DESC
    ) as rn
  FROM custom_decks
)
DELETE FROM custom_deck_cards WHERE deck_id IN (
  SELECT id FROM ranked WHERE rn > 1
);

WITH ranked AS (
  SELECT id, title, user_id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim(title)), user_id 
      ORDER BY (SELECT count(*) FROM custom_deck_cards WHERE deck_id = custom_decks.id) DESC
    ) as rn
  FROM custom_decks
)
DELETE FROM custom_decks WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- Verify: should show no duplicates
SELECT lower(trim(title)) as title, count(*) 
FROM custom_decks 
WHERE user_id = '777f7274-07db-4d64-b217-e7eedc1a1b72'
GROUP BY lower(trim(title)) 
HAVING count(*) > 1;
