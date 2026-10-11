-- ============================================================
-- Modern World History flashcard import for GILAS account
-- Run this in Supabase SQL Editor (postgres role)
-- Target user : si.davidsdx@gmail.com
-- Category    : GILAS (deck_courses)
-- Decks       : 8 decks, one per era/section
-- ============================================================

ALTER TABLE custom_deck_cards ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE custom_decks ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES deck_courses(id) ON DELETE SET NULL;

DO $$
DECLARE
  _user_id   UUID;
  _course_id UUID;
  _deck_id   UUID;
BEGIN
  -- 1. Find the user
  SELECT id INTO _user_id FROM auth.users WHERE email = 'si.davidsdx@gmail.com';
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User si.davidsdx@gmail.com not found in auth.users';
  END IF;

  -- 2. Find or create the GILAS category
  SELECT id INTO _course_id FROM deck_courses WHERE user_id = _user_id AND title = 'GILAS';
  IF _course_id IS NULL THEN
    INSERT INTO deck_courses (user_id, title) VALUES (_user_id, 'GILAS') RETURNING id INTO _course_id;
  END IF;

  -- ============================================================
  -- DECK 1: Age of Exploration and Colonialism (21 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'Age of Exploration and Colonialism', 'Explorers, treaties, systems and ships 1400s-1700s', 21, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Who was Prince Henry the Navigator (1394-1460)?', 'Portuguese prince who funded voyages down the African coast for 40 years and established a navigation school at Sagres. Made Portugal the first European maritime power.', 'Exploration - Portugal', 0),
  (_deck_id, _user_id, 'Who was Bartolomeu Dias (c. 1450-1500)?', 'Portuguese explorer. First European to round the Cape of Good Hope in 1488.', 'Exploration - Portugal', 1),
  (_deck_id, _user_id, 'Who was Vasco da Gama (c. 1460-1524)?', 'Portuguese explorer who completed the sea route to India in 1498. Broke the Venetian-Ottoman spice monopoly.', 'Exploration - Portugal', 2),
  (_deck_id, _user_id, 'Who was Christopher Columbus (1451-1506)?', 'Genoese-born explorer sailing for Spain. Reached the Americas in 1492. Made four voyages. Died believing he had reached Asia.', 'Exploration - Spain', 3),
  (_deck_id, _user_id, 'Who was Amerigo Vespucci (1454-1512)?', 'Italian explorer who identified the Americas as a separate continent (1499-1502). The landmass was named after him.', 'Exploration - naming of America', 4),
  (_deck_id, _user_id, 'Who was Vasco Nunez de Balboa (c. 1475-1519)?', 'Spanish explorer. First European to see the Pacific from the American side in 1513.', 'Exploration - Spain', 5),
  (_deck_id, _user_id, 'Who was Ferdinand Magellan (c. 1480-1521)?', 'Portuguese explorer sailing for Spain. Led the first circumnavigation (1519-1522). Killed in the Philippines. Only 18 of about 270 men returned under Juan Sebastian Elcano.', 'Exploration - circumnavigation', 6),
  (_deck_id, _user_id, 'Who was Hernan Cortes (1485-1547)?', 'Spanish conquistador who conquered the Aztec Empire (1519-1521) with about 500 men. Smallpox devastated the Aztecs.', 'Conquistador - Mexico', 7),
  (_deck_id, _user_id, 'Who was Francisco Pizarro (c. 1475-1541)?', 'Spanish conquistador who conquered the Inca Empire (1531-1533). Executed Atahualpa after collecting a room of gold and silver as ransom.', 'Conquistador - Peru', 8),
  (_deck_id, _user_id, 'Who was Samuel de Champlain (1567-1635)?', 'French explorer who founded Quebec in 1608. Known as the Father of New France.', 'Exploration - France', 9),
  (_deck_id, _user_id, 'Who was Afonso de Albuquerque (1453-1515)?', 'Portuguese admiral who built the Portuguese empire through fortified trading posts: Goa 1510, Malacca 1511, Hormuz 1515.', 'Exploration - Portugal', 10),
  (_deck_id, _user_id, 'What was the Treaty of Tordesillas (1494)?', 'Divided the non-European world between Spain and Portugal. Moved the Line of Demarcation about 800 miles west. Ignored by other European powers.', 'Treaty - Spain vs Portugal', 11),
  (_deck_id, _user_id, 'What was the Treaty of Utrecht (1713)?', 'France ceded Newfoundland, Nova Scotia, and Hudson Bay to Britain. Spain granted Britain the asiento (slave trade monopoly).', 'Treaty - colonial settlement', 12),
  (_deck_id, _user_id, 'What was the Columbian Exchange?', 'Transfer of plants, animals, and diseases between hemispheres. Disease killed about 90 percent of the indigenous population by 1600.', 'System - exchange', 13),
  (_deck_id, _user_id, 'What was the Encomienda system?', 'Spanish crown granted labor and tribute from indigenous people to colonists. Abolished 1720.', 'System - Spanish labor', 14),
  (_deck_id, _user_id, 'What was the Casta System?', 'Racial hierarchy: Peninsulares above Creoles above Mestizos above Mulattoes above Indians above Africans.', 'System - hierarchy', 15),
  (_deck_id, _user_id, 'What was the Middle Passage and Triangular Trade?', '12-15 million Africans transported. Middle Passage mortality 15-20 percent. Route: Europe (manufactured goods) to Africa to Americas (enslaved people) to Europe (raw materials).', 'System - slave trade', 16),
  (_deck_id, _user_id, 'What was a Caravel?', 'Small, maneuverable Portuguese ship. Lateen sails allowed sailing against the wind.', 'Equipment - ship', 17),
  (_deck_id, _user_id, 'What was a Carrack?', 'Larger, heavily armed ship used for trade and colonization.', 'Equipment - ship', 18),
  (_deck_id, _user_id, 'What was a Galleon?', 'Multi-decked Spanish ship used for transatlantic trade.', 'Equipment - ship', 19),
  (_deck_id, _user_id, 'What navigation tools were used in the Age of Exploration?', 'Compass, astrolabe, cross-staff, quadrant, and log line.', 'Equipment - navigation', 20);
  UPDATE custom_decks SET card_count = 21, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 2: Enlightenment Thinkers and Documents (17 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'Enlightenment Thinkers and Documents', 'Philosophers and key documents 18th century', 17, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Who was John Locke (1632-1704)?', 'Wrote Two Treatises on Government (1690). Natural rights: life, liberty, property. Right to rebel against tyrannical government. Influenced the Declaration of Independence.', 'Enlightenment - natural rights', 0),
  (_deck_id, _user_id, 'Who was Thomas Hobbes (1588-1679)?', 'Wrote Leviathan (1651). Argued for absolute sovereignty to prevent chaos.', 'Enlightenment - sovereignty', 1),
  (_deck_id, _user_id, 'Who was Montesquieu (1689-1755)?', 'Wrote The Spirit of Laws (1748). Separation of powers into executive, legislative, and judicial branches. Shaped the U.S. Constitution.', 'Enlightenment - separation of powers', 2),
  (_deck_id, _user_id, 'Who was Voltaire (1694-1778)?', 'Pen name of Francois-Marie Arouet. Attacked the Church and monarchy. Advocated freedom of thought and expression.', 'Enlightenment - free speech', 3),
  (_deck_id, _user_id, 'Who was Jean-Jacques Rousseau (1712-1778)?', 'Wrote The Social Contract (1762). Legitimate authority comes from the general will. Became the bible of French revolutionary leaders.', 'Enlightenment - general will', 4),
  (_deck_id, _user_id, 'Who was Cesare Beccaria (1738-1794)?', 'Wrote On Crimes and Punishments. Argued against torture and capital punishment.', 'Enlightenment - justice reform', 5),
  (_deck_id, _user_id, 'Who was Mary Wollstonecraft (1759-1797)?', 'Wrote A Vindication of the Rights of Women (1792). Argued women are rational beings deserving equal rights.', 'Enlightenment - women rights', 6),
  (_deck_id, _user_id, 'Who was Adam Smith (1723-1790)?', 'Wrote The Wealth of Nations (1776). Founder of modern economics. Free markets and the invisible hand.', 'Enlightenment - economics', 7),
  (_deck_id, _user_id, 'Who was David Hume (1711-1776)?', 'Scottish philosopher who developed modern attitudes toward science and religion.', 'Enlightenment - Scotland', 8),
  (_deck_id, _user_id, 'Who was Immanuel Kant (1724-1804)?', 'Defined Enlightenment as man emerging from his self-imposed immaturity.', 'Enlightenment - definition', 9),
  (_deck_id, _user_id, 'Who was Francis Bacon (1561-1626)?', 'Advocated the inductive method: conclusions from observation.', 'Enlightenment - method', 10),
  (_deck_id, _user_id, 'Who was Rene Descartes (1596-1650)?', 'I think, therefore I am. Advocated reason over the senses.', 'Enlightenment - reason', 11),
  (_deck_id, _user_id, 'What was the Magna Carta (1215)?', 'Limited monarchy. Trial by jury. No punishment without lawful judgment.', 'Document - limits on monarchy', 12),
  (_deck_id, _user_id, 'What was the English Bill of Rights (1689)?', 'Free speech in Parliament. No cruel and unusual punishment.', 'Document - 1689', 13),
  (_deck_id, _user_id, 'What was the Declaration of Independence (1776)?', 'Written by Thomas Jefferson. Natural rights and right to replace government. We hold these truths to be self-evident, that all men are created equal.', 'Document - 1776', 14),
  (_deck_id, _user_id, 'What was the U.S. Constitution (1787)?', 'Three branches of government. Bill of Rights added 1791.', 'Document - 1787', 15),
  (_deck_id, _user_id, 'What was the French Declaration of the Rights of Man and of the Citizen (1789)?', 'Men are born and remain free and equal in rights.', 'Document - 1789', 16);
  UPDATE custom_decks SET card_count = 17, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 3: American Revolution (20 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'American Revolution', 'Figures, battles, documents and tactics 1775-1783', 20, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Who was George Washington (1732-1799)?', 'Commander of the Continental Army. Held the army together through Trenton and Valley Forge. First U.S. President.', 'American Revolution - commander', 0),
  (_deck_id, _user_id, 'Who was Thomas Jefferson (1743-1826)?', 'Author of the Declaration of Independence. Third U.S. President.', 'American Revolution - author', 1),
  (_deck_id, _user_id, 'Who was Benjamin Franklin (1706-1790)?', 'Scientist, printer, diplomat. Secured the French alliance (1778) that was decisive to victory.', 'American Revolution - diplomat', 2),
  (_deck_id, _user_id, 'Who was John Adams (1735-1826)?', 'Diplomat who helped negotiate the peace treaty. Second U.S. President.', 'American Revolution - diplomat', 3),
  (_deck_id, _user_id, 'Who was Benedict Arnold (1741-1801)?', 'Hero of Saratoga who later plotted to surrender West Point to the British (1780).', 'American Revolution - traitor', 4),
  (_deck_id, _user_id, 'Who was John Paul Jones (1747-1792)?', 'Naval commander who defeated the British frigate Serapis. Said: I have not yet begun to fight.', 'American Revolution - navy', 5),
  (_deck_id, _user_id, 'Who was Nathanael Greene (1742-1786)?', 'Southern theater general who wore down Cornwallis with Fabian tactics.', 'American Revolution - south', 6),
  (_deck_id, _user_id, 'Who was Francis Marion (c. 1732-1795)?', 'The Swamp Fox. Guerrilla raids on British supply lines in South Carolina.', 'American Revolution - guerrilla', 7),
  (_deck_id, _user_id, 'Who was the Marquis de Lafayette (1757-1834)?', 'French aristocrat. Aide to Washington who helped secure French reinforcements. Also wrote the Declaration of the Rights of Man and commanded the National Guard.', 'American Revolution - France', 8),
  (_deck_id, _user_id, 'Who was Baron von Steuben (1730-1794)?', 'Prussian officer who drilled the Continental Army at Valley Forge into a disciplined force.', 'American Revolution - training', 9),
  (_deck_id, _user_id, 'Who were the British commanders Gage, Howe, Burgoyne, and Cornwallis?', 'Thomas Gage ordered the Concord expedition. William Howe won Bunker Hill and Long Island but failed to destroy Washington. John Burgoyne surrendered at Saratoga (1777). Charles Cornwallis surrendered at Yorktown (1781). Comte de Rochambeau (1725-1807) was the French general at Yorktown.', 'American Revolution - British', 10),
  (_deck_id, _user_id, 'What happened at Lexington and Concord (Apr 19, 1775)?', 'War begins. 8 Americans killed at Lexington.', 'Battle - 1775', 11),
  (_deck_id, _user_id, 'What happened at Bunker Hill (Jun 17, 1775)?', 'British victory with about 1,000 casualties. Showed Americans could stand up to a professional army.', 'Battle - 1775', 12),
  (_deck_id, _user_id, 'What happened at Trenton (Dec 26, 1776)?', 'Washington crossed the Delaware at night and captured about 900 Hessians. Revived morale.', 'Battle - 1776', 13),
  (_deck_id, _user_id, 'What happened at Saratoga (Oct 17, 1777)?', 'Burgoyne surrendered about 6,000 troops. Convinced France to ally with the Americans. Turning point.', 'Battle - turning point', 14),
  (_deck_id, _user_id, 'What happened at Yorktown (Oct 19, 1781)?', 'Cornwallis trapped by Washington, Rochambeau, and the French fleet. About 7,000 British surrendered. War effectively over.', 'Battle - 1781', 15),
  (_deck_id, _user_id, 'What was Common Sense (1776)?', 'Thomas Paine pamphlet advocating independence. Sold about 500,000 copies.', 'Document - Paine', 16),
  (_deck_id, _user_id, 'What was the Treaty of Paris (1783)?', 'Britain recognized U.S. independence and ceded territory east of the Mississippi.', 'Treaty - independence', 17),
  (_deck_id, _user_id, 'What tactics did the Americans use?', 'Guerrilla warfare against supply lines. Fabian strategy: Washington avoided large-scale battles to preserve his army.', 'Tactics - preservation', 18),
  (_deck_id, _user_id, 'What caused the U.S. entry gap: which battle convinced France to ally?', 'Saratoga (Oct 17, 1777). Burgoyne surrender of about 6,000 troops convinced France to sign the alliance of 1778.', 'Review - Saratoga', 19);
  UPDATE custom_decks SET card_count = 20, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 4: French Revolution and Napoleon (21 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'French Revolution and Napoleon', 'Figures, events, battles and tactics 1789-1815', 21, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Who was Louis XVI (1754-1793)?', 'King of France. Indecisive. Executed Jan 21, 1793.', 'French Revolution - king', 0),
  (_deck_id, _user_id, 'Who was Marie Antoinette (1755-1793)?', 'Queen of France. Austrian-born and resented as a foreigner. Executed Oct 16, 1793.', 'French Revolution - queen', 1),
  (_deck_id, _user_id, 'Who was Maximilien Robespierre (1758-1794)?', 'Jacobin leader. Architect of the Reign of Terror (about 40,000 executed). Guillotined Jul 28, 1794.', 'French Revolution - Terror', 2),
  (_deck_id, _user_id, 'Who was Georges Danton (1759-1794)?', 'Cordeliers Club leader. Initially radical, later urged moderation. Guillotined 1794.', 'French Revolution - Cordeliers', 3),
  (_deck_id, _user_id, 'Who was Jean-Paul Marat (1743-1793)?', 'Radical journalist. Assassinated by Charlotte Corday.', 'French Revolution - journalist', 4),
  (_deck_id, _user_id, 'Who was Emmanuel Sieyes (1748-1836)?', 'Author of What is the Third Estate? Helped Napoleon seize power.', 'French Revolution - theorist', 5),
  (_deck_id, _user_id, 'What was the Estates-General (May 1789)?', 'First meeting since 1614.', 'Event - 1789', 6),
  (_deck_id, _user_id, 'What were the Tennis Court Oath, Bastille, and Declaration of 1789?', 'Tennis Court Oath (Jun 20, 1789): Third Estate declared itself the National Assembly. Storming of the Bastille (Jul 14, 1789): symbol of the Revolution. Declaration of the Rights of Man (Aug 26, 1789): feudal privileges abolished.', 'Events - 1789', 7),
  (_deck_id, _user_id, 'What was the Flight to Varennes (Jun 1791)?', 'Louis XVI attempted to flee and was captured. Lost public trust.', 'Event - 1791', 8),
  (_deck_id, _user_id, 'What happened from the Republic to the coup by Napoleon?', 'Republic declared Sep 1792. Louis XVI executed Jan 21, 1793. Reign of Terror 1793-94. Robespierre executed Jul 28, 1794. The Directory 1795-99. Coup of 18 Brumaire Nov 9, 1799.', 'Timeline - 1792 to 1799', 9),
  (_deck_id, _user_id, 'What happened at Toulon (1793) and in Italy (1796-97)?', 'Toulon was the first major success for Napoleon as an artillery officer. In Italy he defeated Austria, leading to the Treaty of Campo Formio.', 'Napoleon - early campaigns', 10),
  (_deck_id, _user_id, 'What happened in the Egyptian Campaign (1798-99)?', 'Nelson destroyed the French fleet at the Battle of the Nile.', 'Napoleon - Egypt', 11),
  (_deck_id, _user_id, 'What happened at Austerlitz (Dec 2, 1805)?', 'Battle of the Three Emperors. Napoleon defeated Austria and Russia.', 'Napoleon - 1805', 12),
  (_deck_id, _user_id, 'What happened at Trafalgar (Oct 21, 1805)?', 'Nelson destroyed the French and Spanish fleet. Britain secured naval supremacy.', 'Napoleon - naval defeat', 13),
  (_deck_id, _user_id, 'What was the Peninsular War (1808-14)?', 'Spanish and Portuguese guerrillas plus Wellington wore down French forces.', 'Napoleon - Spain', 14),
  (_deck_id, _user_id, 'What happened in the Russian Campaign (1812)?', 'About 600,000 invaded and about 100,000 returned. Scorched earth and winter destroyed the Grande Armee.', 'Napoleon - 1812', 15),
  (_deck_id, _user_id, 'What happened at Leipzig (Oct 16-19, 1813)?', 'Battle of the Nations. Coalition defeated Napoleon.', 'Napoleon - 1813', 16),
  (_deck_id, _user_id, 'What happened at Waterloo (Jun 18, 1815)?', 'Final defeat by Wellington and Blucher. Napoleon exiled to St. Helena.', 'Napoleon - final defeat', 17),
  (_deck_id, _user_id, 'What were Napoleonic tactics?', 'Corps system: self-contained units of 15,000-30,000 men that march separately and concentrate for battle. Mass conscription (levee en masse 1793): all unmarried men 18-25 liable. Massed artillery to soften lines. March divided, fight united.', 'Napoleon - tactics', 18),
  (_deck_id, _user_id, 'What was mass conscription (levee en masse 1793)?', 'All unmarried men aged 18-25 liable for military service. Enabled Napoleonic mass armies.', 'Napoleon - conscription', 19),
  (_deck_id, _user_id, 'Review: order these 1789 events: Bastille, Declaration, Tennis Court Oath?', 'Jun 20 Tennis Court Oath, Jul 14 Bastille, Aug 26 Declaration of the Rights of Man.', 'Review - 1789 order', 20);
  UPDATE custom_decks SET card_count = 21, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 5: 19th Century (26 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, '19th Century', 'Unification, treaties, wars and technology 1800s', 26, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Who was Klemens von Metternich (1773-1859)?', 'Austrian Chancellor. Architect of the Congress of Vienna. Dominated European diplomacy for 30 years. Suppressed liberalism and nationalism.', '19th century - diplomacy', 0),
  (_deck_id, _user_id, 'Who was Otto von Bismarck (1815-1898)?', 'Prussian Minister-President from 1862. Unified Germany through blood and iron: three wars in 1864, 1866, 1870-71. Engineered the Ems Telegram to provoke war with France. Chancellor of the German Empire 1871-1890.', '19th century - Germany', 1),
  (_deck_id, _user_id, 'Who was Giuseppe Mazzini (1805-1872)?', 'Founded Young Italy (1831). Wanted a unified Italian republic.', '19th century - Italy', 2),
  (_deck_id, _user_id, 'Who was Count Cavour (1810-1861)?', 'Prime Minister of Piedmont-Sardinia. Engineered Italian unification through diplomacy and war.', '19th century - Italy', 3),
  (_deck_id, _user_id, 'Who was Giuseppe Garibaldi (1807-1882)?', 'Led the Expedition of the Thousand (1860) and conquered Sicily and Naples.', '19th century - Italy', 4),
  (_deck_id, _user_id, 'Who was Victor Emmanuel II (1820-1878)?', 'First King of unified Italy (1861).', '19th century - Italy', 5),
  (_deck_id, _user_id, 'Who was Simon Bolivar (1783-1830)?', 'The Liberator. Led independence in Venezuela, Colombia, Ecuador, Peru, and Bolivia.', '19th century - Latin America', 6),
  (_deck_id, _user_id, 'Who was Karl Marx (1818-1883)?', 'Wrote the Communist Manifesto (1848) with Friedrich Engels. History as class struggle. Predicted workers revolution.', '19th century - communism', 7),
  (_deck_id, _user_id, 'Who was Commodore Matthew Perry (1794-1858)?', 'U.S. naval officer who forced Japan to open to foreign trade (1853).', '19th century - Japan', 8),
  (_deck_id, _user_id, 'Who was Abraham Lincoln (1809-1865)?', 'U.S. President 1861-1865. Issued the Emancipation Proclamation (effective Jan 1, 1863). Assassinated April 14, 1865.', '19th century - USA', 9),
  (_deck_id, _user_id, 'Who were Ulysses S. Grant and Robert E. Lee?', 'Grant (1822-1885): Union general who won Vicksburg and accepted surrender at Appomattox. Lee (1807-1870): Confederate general who lost at Gettysburg and surrendered April 9, 1865.', '19th century - Civil War', 10),
  (_deck_id, _user_id, 'What was the Congress of Vienna (1815)?', 'Restored balance of power. Key decisions made by Britain, Russia, Austria, and Prussia.', 'Treaty - 1815', 11),
  (_deck_id, _user_id, 'What was the Monroe Doctrine (1823)?', 'U.S. opposed European colonization in the Americas.', 'Doctrine - 1823', 12),
  (_deck_id, _user_id, 'What was the Treaty of Guadalupe Hidalgo (1848)?', 'Ended the Mexican-American War. U.S. paid 15M dollars for California, New Mexico, Arizona, Nevada, and Utah.', 'Treaty - 1848', 13),
  (_deck_id, _user_id, 'What was the Treaty of Nanking (1842)?', 'Ended the First Opium War. Hong Kong to Britain. Five ports opened.', 'Treaty - China', 14),
  (_deck_id, _user_id, 'What was the Berlin Conference (1884-85)?', 'Partitioned Africa. Established the effective occupation principle.', 'Conference - Africa', 15),
  (_deck_id, _user_id, 'What was the Trail of Tears (1838)?', 'About 15,000 Cherokee forced from Georgia to Oklahoma. About 4,000 died.', 'Event - 1838', 16),
  (_deck_id, _user_id, 'What happened in the Mexican-American War (1846-48)?', 'U.S. won decisive battles. Ended with the Treaty of Guadalupe Hidalgo.', 'War - 1846', 17),
  (_deck_id, _user_id, 'What was the Seneca Falls Convention (1848)?', 'First women rights convention in the U.S.', 'Event - 1848', 18),
  (_deck_id, _user_id, 'What happened in the US Civil War (1861-65)?', 'About 620,000 deaths. Gettysburg (Jul 1-3, 1863) was the turning point with about 51,000 casualties.', 'War - 1861', 19),
  (_deck_id, _user_id, 'What was the Emancipation Proclamation (1863)?', 'Freed slaves in Confederate states.', 'Document - 1863', 20),
  (_deck_id, _user_id, 'What happened in the Franco-Prussian War (1870-71)?', 'Prussia defeated France. German Empire proclaimed at Versailles.', 'War - 1870', 21),
  (_deck_id, _user_id, 'What happened at the Battle of Little Big Horn (1876)?', 'Sioux victory over Custer.', 'Battle - 1876', 22),
  (_deck_id, _user_id, 'How was Germany unified?', '1864 Danish War, then 1866 Austro-Prussian War, then 1870-71 Franco-Prussian War. Empire proclaimed Jan 18, 1871.', 'Unification - Germany', 23),
  (_deck_id, _user_id, 'How was Italy unified?', '1859 War with Austria, 1860 Garibaldi Thousand, 1861 Kingdom proclaimed, 1866 Venetia, 1870 Rome.', 'Unification - Italy', 24),
  (_deck_id, _user_id, 'What 19th-century technology and ideology matter most?', 'Railways, telegraph, breech-loading rifles, ironclad warships. Social Darwinism used to justify imperialism.', '19th century - tech', 25);
  UPDATE custom_decks SET card_count = 26, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 6: World War I (26 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'World War I', 'Causes, figures, battles, treaties and weapons 1914-1918', 26, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'What were the causes of WWI (MAIN)?', 'Militarism, Alliances, Imperialism, Nationalism.', 'Causes - MAIN', 0),
  (_deck_id, _user_id, 'Who was Archduke Franz Ferdinand and who killed him?', 'Heir to the Austro-Hungarian throne. Assassinated June 28, 1914 in Sarajevo by Gavrilo Princip, a 19-year-old Bosnian Serb and Black Hand member.', 'WWI - trigger', 1),
  (_deck_id, _user_id, 'Who was Kaiser Wilhelm II?', 'German Emperor. Gave Austria-Hungary the blank check.', 'WWI - Germany', 2),
  (_deck_id, _user_id, 'Who was Tsar Nicholas II?', 'Russian Emperor. Mobilized against Austria-Hungary. Abdicated March 1917.', 'WWI - Russia', 3),
  (_deck_id, _user_id, 'Who was Woodrow Wilson?', 'U.S. President. Declared war April 1917. Fourteen Points and the League of Nations.', 'WWI - USA', 4),
  (_deck_id, _user_id, 'Who were Lloyd George and Clemenceau?', 'David Lloyd George: British PM from Dec 1916, at the Paris Peace Conference. Georges Clemenceau: French Premier from Nov 1917, wanted harsh terms for Germany.', 'WWI - peace conference', 5),
  (_deck_id, _user_id, 'Who were Haig, Joffre, Foch, Petain, and Pershing?', 'Douglas Haig: British Field Marshal commanding the BEF. Joseph Joffre: French Commander-in-Chief 1914-1916. Ferdinand Foch: Supreme Allied Commander 1918. Philippe Petain: defended Verdun, later head of Vichy France. John J. Pershing: commander of the American Expeditionary Forces.', 'WWI - Allied commanders', 6),
  (_deck_id, _user_id, 'Who were Hindenburg, Ludendorff, and Falkenhayn?', 'Paul von Hindenburg: German Field Marshal, later Chief of Staff. Erich Ludendorff: Quartermaster-General who effectively directed the war. Erich von Falkenhayn: Chief of Staff 1914-1916 who planned Verdun.', 'WWI - German commanders', 7),
  (_deck_id, _user_id, 'Who were Scheer, Hipper, and Mustafa Kemal?', 'Reinhard Scheer: German High Seas Fleet commander at Jutland. Franz von Hipper: battlecruiser commander at Jutland. Mustafa Kemal: Ottoman commander at Gallipoli, later Ataturk.', 'WWI - naval and Ottoman', 8),
  (_deck_id, _user_id, 'Who were the Red Baron and Mata Hari?', 'Manfred von Richthofen, the Red Baron: 80 confirmed kills. Mata Hari: Dutch exotic dancer and suspected spy, executed Oct 15, 1917.', 'WWI - famous figures', 9),
  (_deck_id, _user_id, 'What was the Treaty of Brest-Litovsk (Mar 3, 1918)?', 'Russia exited the war. Ceded Poland, Baltic states, Ukraine, and Finland to Germany.', 'Treaty - Russia exits', 10),
  (_deck_id, _user_id, 'What did the Treaty of Versailles (Jun 28, 1919) impose on Germany?', 'Article 231 War Guilt Clause. Army max 100,000. No conscription, tanks, aircraft, or submarines. Reparations 132 billion gold marks. Alsace-Lorraine to France. Rhineland demilitarized. 13 percent of territory lost.', 'Treaty - Versailles', 11),
  (_deck_id, _user_id, 'What were the Treaties of Saint-Germain, Trianon, and Sevres?', 'Saint-Germain (Sep 10, 1919): Austria lost Bohemia, Moravia, Slovenia, Dalmatia. Trianon (Jun 4, 1920): Hungary lost two thirds of territory and 60 percent of population. Sevres (Aug 10, 1920): Ottoman Empire partitioned.', 'Treaties - other Central Powers', 12),
  (_deck_id, _user_id, 'What happened at the First Battle of the Marne (Sep 6-10, 1914)?', 'French and British halted the German advance 40 km from Paris. End of the Schlieffen Plan. Start of trench warfare.', 'Battle - Marne', 13),
  (_deck_id, _user_id, 'What happened at Tannenberg (Aug 26-30, 1914)?', 'Major German victory on the Eastern Front.', 'Battle - Tannenberg', 14),
  (_deck_id, _user_id, 'What was the Gallipoli Campaign (Apr 25, 1915 - Jan 9, 1916)?', 'Allied attempt to knock the Ottoman Empire out of the war. Failed.', 'Battle - Gallipoli', 15),
  (_deck_id, _user_id, 'What happened at Verdun (Feb 21 - Dec 18, 1916)?', 'German offensive to bleed France white. About 300,000 dead. French held.', 'Battle - Verdun', 16),
  (_deck_id, _user_id, 'What happened at the Somme (Jul 1 - Nov 18, 1916)?', 'First day: 57,470 British casualties. First use of tanks on Sep 15.', 'Battle - Somme', 17),
  (_deck_id, _user_id, 'What happened at Jutland (May 31 - Jun 1, 1916)?', 'Largest naval battle of WWI. Strategic British victory.', 'Battle - Jutland', 18),
  (_deck_id, _user_id, 'What was Passchendaele / Third Ypres (Jul - Nov 1917)?', 'Inconclusive. Heavy rainfall turned the battlefield into mud.', 'Battle - Passchendaele', 19),
  (_deck_id, _user_id, 'What were Belleau Wood, Meuse-Argonne, and the Hundred Days?', 'Belleau Wood (Jun 1918): defining moment for U.S. Marines. Meuse-Argonne (Sep 26 - Nov 11, 1918): largest U.S. operation, about 26,000 American deaths. Hundred Days (Aug - Nov 1918): Allied offensives that ended the war.', 'Battles - 1918', 20),
  (_deck_id, _user_id, 'What was HMS Dreadnought (1906)?', '18,120 tons. 10 twelve-inch guns. 21 knots. All-big-gun armament that made earlier battleships obsolete.', 'Ship - Dreadnought', 21),
  (_deck_id, _user_id, 'What was the U-boat Type U-81 and HMS Argus?', 'Type U-81: 808 tons surfaced, 12 torpedoes, one 10.5 cm deck gun. HMS Argus: first true aircraft carrier, commissioned Sep 1918.', 'Ships - submarine and carrier', 22),
  (_deck_id, _user_id, 'What was the British Grand Fleet in WWI?', '22 dreadnoughts, 9 battlecruisers, 40 pre-dreadnoughts, 121 cruisers, 221 destroyers, 73 submarines.', 'Fleet - composition', 23),
  (_deck_id, _user_id, 'What were the Mark I (1916) and Renault FT (1917) tanks?', 'Mark I (British): 28 tons, 6 mph, two 6-pounder guns plus machine guns. Renault FT (French): 7 tons, rotating turret, 37 mm gun, 8 km per hour.', 'Tanks - WWI', 24),
  (_deck_id, _user_id, 'What new weapons and tactics defined WWI?', 'Machine guns (Maxim, Vickers): 450-600 rounds per minute. Poison gas: chlorine 1915, phosgene 1915, mustard gas 1917. Stormtroopers: German elite infiltration units, precursor to Blitzkrieg. Unrestricted Submarine Warfare announced Jan 31, 1917: direct cause of U.S. entry.', 'Weapons - WWI', 25);
  UPDATE custom_decks SET card_count = 26, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 7: World War II (34 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'World War II', 'Figures, operations, battles, equipment 1939-1945', 34, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'How many died in WWII?', 'About 60 million total: 25M military, 35M civilian.', 'WWII - deaths', 0),
  (_deck_id, _user_id, 'Who was Adolf Hitler?', 'Fuhrer of Germany. Became Chancellor 1933. Built the military in violation of Versailles. Committed suicide Apr 30, 1945.', 'WWII - Germany', 1),
  (_deck_id, _user_id, 'Who was Benito Mussolini?', 'Duce of Italy. Developed fascism. Executed by Italian partisans Apr 28, 1945.', 'WWII - Italy', 2),
  (_deck_id, _user_id, 'Who were Hirohito and Hideki Tojo?', 'Emperor Hirohito: announced surrender Aug 15, 1945. Hideki Tojo: Prime Minister Oct 1941 - Jul 1944, ordered the Pearl Harbor attack, executed 1948.', 'WWII - Japan', 3),
  (_deck_id, _user_id, 'Who was Erwin Rommel?', 'The Desert Fox. Commanded the Afrika Korps. Defeated at El Alamein. Forced to commit suicide Oct 14, 1944.', 'WWII - Germany', 4),
  (_deck_id, _user_id, 'Who was Heinz Guderian?', 'Architect of Blitzkrieg. Wrote Achtung Panzer (1937). Led the 19th Panzer Corps through the Ardennes to the Channel in 1940.', 'WWII - Blitzkrieg', 5),
  (_deck_id, _user_id, 'Who were Manstein, Paulus, and Donitz?', 'Erich von Manstein: planned the 1940 invasion of France (Sichelschnitt). Friedrich Paulus: 6th Army commander at Stalingrad, surrendered Feb 2, 1943. Karl Donitz: U-boat commander who succeeded Hitler as President for 23 days.', 'WWII - German generals', 6),
  (_deck_id, _user_id, 'Who was Winston Churchill?', 'British PM May 1940 - Jul 1945. Blood, toil, tears and sweat speech.', 'WWII - Britain', 7),
  (_deck_id, _user_id, 'Who were Roosevelt, Truman, and Stalin?', 'Franklin D. Roosevelt: U.S. President 1933-1945, died Apr 12, 1945. Harry S. Truman: President 1945-1953, authorized atomic bombings. Joseph Stalin: Soviet Premier, signed the Nazi-Soviet Pact 1939, joined Allies after the 1941 invasion.', 'WWII - Allied leaders', 8),
  (_deck_id, _user_id, 'Who were Eisenhower, Montgomery, and Patton?', 'Dwight D. Eisenhower: Supreme Allied Commander who planned Operation Overlord. Bernard Montgomery: won El Alamein 1942, commanded Market Garden. George S. Patton: relieved Bastogne during the Battle of the Bulge.', 'WWII - Western generals', 9),
  (_deck_id, _user_id, 'Who were MacArthur, Nimitz, and Zhukov?', 'Douglas MacArthur: Pacific commander, I shall return. Chester Nimitz: Pacific Fleet commander. Georgy Zhukov: led Moscow defense, Stalingrad counteroffensive, capture of Berlin.', 'WWII - Pacific and Soviet', 10),
  (_deck_id, _user_id, 'Who were De Gaulle, Marshall, and Yamamoto?', 'Charles de Gaulle: leader of Free French Forces. George C. Marshall: Army Chief of Staff, later Marshall Plan. Isoroku Yamamoto: planned Pearl Harbor, killed April 1943.', 'WWII - others', 11),
  (_deck_id, _user_id, 'What were the Munich Agreement (1938) and Nazi-Soviet Pact (1939)?', 'Munich: Britain and France gave Hitler the Sudetenland; he broke the promise within six months. Nazi-Soviet Pact: nonaggression with a secret protocol dividing Poland.', 'Treaties - before the war', 12),
  (_deck_id, _user_id, 'What were the Tripartite Pact, Atlantic Charter, and Lend-Lease?', 'Tripartite Pact (1940): Axis alliance of Germany, Italy, Japan. Atlantic Charter (1941): Anglo-American war aims. Lend-Lease Act (1941): U.S. aid to Allies.', 'Agreements - wartime', 13),
  (_deck_id, _user_id, 'What were the Yalta and Potsdam Conferences?', 'Yalta (Feb 1945): Germany and Berlin divided into four zones. Potsdam (Jul-Aug 1945): ultimatum to Japan.', 'Conferences - 1945', 14),
  (_deck_id, _user_id, 'What were Operations Overlord and Neptune (Jun 6, 1944)?', 'Overlord: D-Day Allied invasion of Normandy, 156,000 landed. Neptune: naval phase with 5,300 plus ships and 11,000 plus planes.', 'Operation - Normandy', 15),
  (_deck_id, _user_id, 'What were Operations Barbarossa, Torch, and Husky?', 'Barbarossa (Jun 22, 1941): German invasion of USSR with about 3 million troops. Torch (Nov 8, 1942): invasion of North Africa. Husky (Jul 10, 1943): invasion of Sicily.', 'Operations - 1941 to 1943', 16),
  (_deck_id, _user_id, 'What were Operations Bagration, Market Garden, and Dynamo?', 'Bagration (Jun-Aug 1944): Soviet destruction of Army Group Center, about 450,000 German casualties. Market Garden (Sep 17-25, 1944): failed Allied airborne operation, A Bridge Too Far. Dynamo (May 26 - Jun 4, 1940): Dunkirk evacuation of 338,000 troops.', 'Operations - East, West, Dunkirk', 17),
  (_deck_id, _user_id, 'What were the Bulge, Sea Lion, and Bodenplatte operations?', 'Wacht am Rhein (Dec 16, 1944): Battle of the Bulge. Sea Lion: planned German invasion of Britain, never executed. Bodenplatte (Jan 1, 1945): failed German attack on Allied airbases.', 'Operations - Bulge and air', 18),
  (_deck_id, _user_id, 'What were Operations Watchtower, Detachment, and Iceberg?', 'Watchtower (Aug 7, 1942): Guadalcanal. Detachment (Feb 1945): Iwo Jima. Iceberg (Apr 1945): Okinawa.', 'Operations - Pacific', 19),
  (_deck_id, _user_id, 'What happened at Stalingrad (Aug 1942 - Feb 1943)?', 'About 2 million casualties. 91,000 Germans captured. Turning point on the Eastern Front.', 'Battle - Stalingrad', 20),
  (_deck_id, _user_id, 'What happened at Kursk (Jul 5 - Aug 23, 1943)?', 'Largest tank battle ever. About 6,000 tanks engaged.', 'Battle - Kursk', 21),
  (_deck_id, _user_id, 'What happened at Midway (Jun 4-7, 1942) and Coral Sea (May 4-8, 1942)?', 'Midway: 4 Japanese carriers sunk. Turning point in the Pacific. Coral Sea: first carrier battle, prevented Japanese invasion of Australia.', 'Battles - carriers', 22),
  (_deck_id, _user_id, 'What were Guadalcanal and Leyte Gulf?', 'Guadalcanal (Aug 7, 1942 - Feb 9, 1943): first U.S. offensive in the Pacific. Leyte Gulf (Oct 23-26, 1944): largest naval battle in history.', 'Battles - Pacific', 23),
  (_deck_id, _user_id, 'What happened at Iwo Jima and Okinawa?', 'Iwo Jima (Feb 19 - Mar 26, 1945): about 6,800 U.S. dead. Okinawa (Apr 1 - Jun 22, 1945): about 12,000 U.S. dead.', 'Battles - islands', 24),
  (_deck_id, _user_id, 'What were the D-Day beaches and casualties?', 'Utah (U.S., 23,000 troops, light casualties), Omaha (U.S., 34,000 troops, about 2,000 casualties), Gold (British, 25,000), Juno (Canadian, 21,000, about 1,000 casualties), Sword (British, 29,000). About 10,000 Allied casualties total on Jun 6, 1944.', 'D-Day - beaches', 25),
  (_deck_id, _user_id, 'What happened in the Bulge, Berlin, Britain, Atlantic, and El Alamein?', 'Bulge (Dec 16, 1944 - Jan 25, 1945): about 89,000 U.S. casualties, last German offensive in the West. Berlin (Apr-May 1945): Hitler suicide and surrender. Britain (Jul-Oct 1940): RAF defeated the Luftwaffe. Atlantic: U-boat campaign against shipping. El Alamein (Oct 23 - Nov 4, 1942): Montgomery defeated Rommel.', 'Battles - Europe', 26),
  (_deck_id, _user_id, 'What German tanks mattered: Panzer IV, Tiger I, Tiger II, Panther?', 'Panzer IV: 25 tons, 75 mm gun, 26 mph. Tiger I: 58.9 tons, 88 mm gun, 24 mph. Tiger II (King Tiger): 68 tons, 88 mm gun. Panther: 45.5 tons, 75 mm gun, 46 mph.', 'Tanks - German', 27),
  (_deck_id, _user_id, 'What Allied tanks mattered: T-34, IS-2, Sherman, Churchill?', 'T-34 (USSR): 26 tons, 76.2 mm gun, 55 km per hour. IS-2 (USSR): 122 mm gun. M4 Sherman (U.S.): 30 tons, 75 mm gun, 38 mph. Churchill (Britain): heavy infantry tank.', 'Tanks - Allied', 28),
  (_deck_id, _user_id, 'What fighter aircraft mattered in WWII?', 'Spitfire (Britain): 8 machine guns. Hurricane (Britain): backbone of the Battle of Britain. Bf 109 (Germany): 20 mm cannon plus machine guns. Fw 190 (Germany): fighter. Zero (Japan): carrier fighter with exceptional range. P-51 Mustang (U.S.): long-range escort. P-47 Thunderbolt (U.S.): 8 fifty-cal guns. Me 262 (Germany): first operational jet fighter.', 'Aircraft - fighters', 29),
  (_deck_id, _user_id, 'What bomber and attack aircraft mattered in WWII?', 'B-17 Flying Fortress and B-29 Superfortress (U.S., B-29 dropped atomic bombs). Lancaster (Britain): heavy bomber. Ju 87 Stuka (Germany): dive bomber. SBD Dauntless (U.S.): sank 4 carriers at Midway.', 'Aircraft - bombers', 30),
  (_deck_id, _user_id, 'What warships mattered in WWII?', 'Bismarck (Germany): 51,000 tons, 8 fifteen-inch guns, sunk May 27, 1941. Yamato (Japan): 72,000 tons, 9 eighteen-inch guns, sunk Apr 7, 1945. Enterprise (U.S.): most decorated U.S. ship. Yorktown (U.S.): sunk at Midway. Akagi, Kaga, Soryu, Hiryu (Japan): all sunk at Midway. Type VII U-boat: 769 tons, 14 torpedoes. LCVP Higgins boat: 36 ft, 36 troops. Missouri: surrender signed on deck Sep 2, 1945.', 'Ships - WWII', 31),
  (_deck_id, _user_id, 'What tactics defined WWII?', 'Blitzkrieg: tanks plus dive bombers plus motorized infantry plus radio, bypassing strongpoints. Island-Hopping: capture key islands, bypass others. Wolfpack: U-boat group attacks on convoys. Kamikaze: Japanese suicide pilots. Total War: full economic mobilization, rationing, propaganda.', 'Tactics - WWII', 32),
  (_deck_id, _user_id, 'What happened at Hiroshima and Nagasaki?', 'Little Boy (Aug 6, 1945, Hiroshima): 15 kilotons, about 70,000 dead, dropped by B-29 Enola Gay. Fat Man (Aug 9, 1945, Nagasaki): 21 kilotons, about 40,000 dead, dropped by Bockscar.', 'Atomic bombings', 33);
  UPDATE custom_decks SET card_count = 34, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 8: Cold War and Modern World (28 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'Cold War and Modern World', 'Figures, treaties, crises and decolonization 1945-present', 28, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Who was Harry S. Truman and what was the Truman Doctrine?', 'U.S. President 1945-1953. Doctrine announced Mar 12, 1947: support free peoples resisting subjugation.', 'Cold War - Truman', 0),
  (_deck_id, _user_id, 'Who was Joseph Stalin in the Cold War?', 'Soviet Premier. Created the Eastern Bloc. Blockaded Berlin in 1948. Died 1953.', 'Cold War - Stalin', 1),
  (_deck_id, _user_id, 'Who was Nikita Khrushchev (1953-1964)?', 'Soviet Premier. Denounced Stalin. Placed missiles in Cuba in 1962, then withdrew them.', 'Cold War - Khrushchev', 2),
  (_deck_id, _user_id, 'Who was John F. Kennedy (1961-1963)?', 'U.S. President. Bay of Pigs 1961. Cuban Missile Crisis 1962. Assassinated Nov 22, 1963.', 'Cold War - Kennedy', 3),
  (_deck_id, _user_id, 'Who were Lyndon B. Johnson and Richard Nixon?', 'Johnson (1963-1969): escalated the Vietnam War. Nixon (1969-1974): detente, visited China 1972, withdrew from Vietnam, resigned over Watergate.', 'Cold War - presidents', 4),
  (_deck_id, _user_id, 'Who were Gorbachev and Reagan?', 'Mikhail Gorbachev (1985-1991): glasnost and perestroika, reforms contributed to USSR collapse. Ronald Reagan (1981-1989): escalated the Cold War, Tear down this wall speech 1987.', 'Cold War - endgame', 5),
  (_deck_id, _user_id, 'Who were George Kennan, Brezhnev, and Eisenhower?', 'George Kennan: diplomat who authored containment policy. Leonid Brezhnev (1964-1982): signed SALT I. Dwight D. Eisenhower (1953-1961): proposed the Domino Theory.', 'Cold War - strategists', 6),
  (_deck_id, _user_id, 'What were the UN, Truman Doctrine, and Marshall Plan?', 'United Nations (1945): international peacekeeping. Truman Doctrine (1947): containment of communism. Marshall Plan (1947): 13.3 billion dollars in U.S. aid to rebuild Europe.', 'Orgs - 1945 to 1947', 7),
  (_deck_id, _user_id, 'What were NATO, COMECON, the Warsaw Pact, and SEATO?', 'NATO (Apr 4, 1949): Western alliance, Article 5 attack on one is attack on all. COMECON (1949): Soviet response to the Marshall Plan. Warsaw Pact (May 14, 1955): Eastern alliance. SEATO (1954): Asian counterpart to NATO.', 'Alliances', 8),
  (_deck_id, _user_id, 'What were the Test Ban, SALT I, SALT II, INF, and START I?', 'Test Ban (1963): banned atmospheric tests. SALT I (1972): limited ABM systems and ICBMs. SALT II (1979): never ratified. INF (1987): eliminated intermediate-range missiles. START I (1991): reduced strategic warheads.', 'Arms control', 9),
  (_deck_id, _user_id, 'What was the Berlin Blockade and Airlift (1948-49)?', '2.3 million tons airlifted over 278,228 flights.', 'Crisis - Berlin', 10),
  (_deck_id, _user_id, 'What happened in the Korean War (1950-53)?', 'About 2.5 million deaths. Armistice Jul 27, 1953.', 'War - Korea', 11),
  (_deck_id, _user_id, 'What was the Bay of Pigs (Apr 17-19, 1961)?', 'Failed CIA-backed invasion of Cuba.', 'Crisis - Cuba', 12),
  (_deck_id, _user_id, 'What was the Cuban Missile Crisis (Oct 1962)?', '13 days. 42 R-12 missiles in Cuba. USSR withdrew; U.S. secretly removed Jupiters from Turkey.', 'Crisis - 1962', 13),
  (_deck_id, _user_id, 'What happened in the Vietnam War (1955-75)?', 'About 58,000 U.S. dead. Operations: Rolling Thunder 1965-68, Tet Offensive 1968, Linebacker II 1972.', 'War - Vietnam', 14),
  (_deck_id, _user_id, 'When did the Berlin Wall fall and the USSR dissolve?', 'Berlin Wall fell Nov 9, 1989. USSR dissolved Dec 26, 1991.', 'End - 1989 and 1991', 15),
  (_deck_id, _user_id, 'What were MAD, containment, domino theory, and salami tactics?', 'MAD: Mutual Assured Destruction. Containment: stop the spread of communism. Domino Theory: fall of one country leads to others. Salami Tactics: gradual Soviet political control in Eastern Europe.', 'Strategy - doctrines', 16),
  (_deck_id, _user_id, 'What were proxy wars and MIRVs?', 'Proxy Wars: superpowers supported opposing sides. MIRVs: multiple warheads per missile.', 'Strategy - tech', 17),
  (_deck_id, _user_id, 'What nuclear weapons bracket the era: Little Boy to SS-18?', 'Little Boy (1945): 15 kilotons, uranium gun-type. Fat Man (1945): 21 kilotons, plutonium implosion. Tsar Bomba (1961): 50 megatons, largest ever detonated. SS-18 Satan (1975): 10 warheads of 550 kilotons, 11,000 km range ICBM.', 'Weapons - nuclear', 18),
  (_deck_id, _user_id, 'What happened in decolonization?', '1947: India and Pakistan independent. 1960: 17 African nations independent. 1955: Bandung Conference, Third World emerges.', 'Decolonization', 19),
  (_deck_id, _user_id, 'What were the Algerian War, Congo Crisis, and Biafran War?', 'Algerian War 1954-62, Congo Crisis 1960-65, Biafran War 1967-70: key decolonization conflicts.', 'Decolonization - conflicts', 20),
  (_deck_id, _user_id, 'What was the AK-47?', 'Creator Mikhail Kalashnikov, 1947, USSR. Gas-operated selective fire, 7.62x39mm, 30-round magazine, 600 rpm, 300m effective. Over 100 million produced, most widely used assault rifle.', 'Weapon - AK-47', 21),
  (_deck_id, _user_id, 'What was the M-16?', 'Creator Eugene Stoner, adopted 1964, USA. 5.56 NATO, 20/30-round, 700-900 rpm, 550m effective, 3.4 kg. U.S. standard from Vietnam onward.', 'Weapon - M-16', 22),
  (_deck_id, _user_id, 'What changed air travel: 707, 747, Concorde?', 'Boeing 707 (1958): first mass jetliner, 150 passengers. 747 Jumbo (1969): 400 plus passengers. Concorde (1976-2003): supersonic.', 'Transport - air', 23),
  (_deck_id, _user_id, 'What changed land and sea transport after 1945?', 'Shinkansen bullet train (Japan 1964, 210 km per hour, now 320). TGV France 1981. Container shipping (Malcolm McLean 1956): standard 20/40-ft boxes, cut shipping cost about 90 percent. Interstate Highway System USA 1956.', 'Transport - land and sea', 24),
  (_deck_id, _user_id, 'What were the space milestones?', 'Sputnik 1 (Oct 4, 1957): first satellite. Yuri Gagarin (Apr 12, 1961): first human orbit. Apollo 11 (Jul 20, 1969): Moon landing. ISS (1998): continuous habitation since 2000. Falcon reusable (2015): SpaceX.', 'Space race', 25),
  (_deck_id, _user_id, 'What were ARPANET, WWW, and GPS?', 'ARPANET 1969 (DARPA). World Wide Web by Tim Berners-Lee 1990 at CERN. GPS operational 1995, civilian open 2000.', 'Tech - internet', 26),
  (_deck_id, _user_id, 'What ideologies and philosophies shaped the modern world?', 'Capitalism vs communism. Decolonization nationalism. Non-Alignment 1961 (Tito, Nehru, Nasser). Neoliberalism (Hayek, Friedman, Reagan, Thatcher). Environmentalism (Carson Silent Spring 1962). Human rights (UDHR 1948, Geneva 1949, ICC 2002). Globalization (WTO 1995, EU Maastricht 1993).', 'Ideology - modern', 27);
  UPDATE custom_decks SET card_count = 28, updated_at = now() WHERE id = _deck_id;

  RAISE NOTICE 'Import complete for user % in category GILAS', _user_id;
END $$;
