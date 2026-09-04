-- Delete the "pdf-generated" deck and its cards (duplicates the individual decks)
DELETE FROM custom_deck_cards WHERE deck_id IN (
  SELECT id FROM custom_decks WHERE title = 'pdf-generated' AND user_id = '777f7274-07db-4d64-b217-e7eedc1a1b72'
);
DELETE FROM custom_decks WHERE title = 'pdf-generated' AND user_id = '777f7274-07db-4d64-b217-e7eedc1a1b72';

-- Also clean up any other decks with 0 cards
DELETE FROM custom_decks WHERE card_count = 0 AND user_id = '777f7274-07db-4d64-b217-e7eedc1a1b72';

-- Verify: show remaining decks
SELECT id, title, card_count FROM custom_decks 
WHERE user_id = '777f7274-07db-4d64-b217-e7eedc1a1b72'
ORDER BY title;
