-- ============================================================
-- Modern World History flashcard import for GILAS account
-- Run this in Supabase SQL Editor (postgres role)
-- Target user : si.davidsdx@gmail.com
-- Category    : GILAS (deck_courses)
-- Decks       : 8 decks, one per era/section
-- ============================================================

ALTER TABLE custom_deck_cards ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE custom_decks ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES deck_courses(id) ON DELETE SET NULL;

-- Idempotency: remove previous import of these 8 decks so re-running never duplicates
DELETE FROM custom_decks WHERE user_id = (SELECT id FROM auth.users WHERE email = 'si.davidsdx@gmail.com')
AND title IN ('Age of Exploration and Colonialism',
'Enlightenment Thinkers and Documents',
'American Revolution',
'French Revolution and Napoleon',
'19th Century',
'World War I',
'World War II',
'Cold War and Modern World');

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
  (_deck_id, _user_id, 'Portuguese prince who funded voyages down the African coast for 40 years and established a navigation school at Sagres. Made Portugal the first European maritime power.', 'Prince Henry the Navigator (1394-1460)', 'Exploration - Portugal', 0),
  (_deck_id, _user_id, 'Portuguese explorer. First European to round the Cape of Good Hope in 1488.', 'Bartolomeu Dias (c. 1450-1500)', 'Exploration - Portugal', 1),
  (_deck_id, _user_id, 'Portuguese explorer who completed the sea route to India in 1498. Broke the Venetian-Ottoman spice monopoly.', 'Vasco da Gama (c. 1460-1524)', 'Exploration - Portugal', 2),
  (_deck_id, _user_id, 'Genoese-born explorer sailing for Spain. Reached the Americas in 1492. Made four voyages. Died believing he had reached Asia.', 'Christopher Columbus (1451-1506)', 'Exploration - Spain', 3),
  (_deck_id, _user_id, 'Italian explorer who identified the Americas as a separate continent (1499-1502). The landmass was named after him.', 'Amerigo Vespucci (1454-1512)', 'Exploration - naming of America', 4),
  (_deck_id, _user_id, 'Spanish explorer. First European to see the Pacific from the American side in 1513.', 'Vasco Nunez de Balboa (c. 1475-1519)', 'Exploration - Spain', 5),
  (_deck_id, _user_id, 'Portuguese explorer sailing for Spain. Led the first circumnavigation (1519-1522). Killed in the Philippines. Only 18 of about 270 men returned under Juan Sebastian Elcano.', 'Ferdinand Magellan (c. 1480-1521)', 'Exploration - circumnavigation', 6),
  (_deck_id, _user_id, 'Spanish conquistador who conquered the Aztec Empire (1519-1521) with about 500 men. Smallpox devastated the Aztecs.', 'Hernan Cortes (1485-1547)', 'Conquistador - Mexico', 7),
  (_deck_id, _user_id, 'Spanish conquistador who conquered the Inca Empire (1531-1533). Executed Atahualpa after collecting a room of gold and silver as ransom.', 'Francisco Pizarro (c. 1475-1541)', 'Conquistador - Peru', 8),
  (_deck_id, _user_id, 'French explorer who founded Quebec in 1608. Known as the Father of New France.', 'Samuel de Champlain (1567-1635)', 'Exploration - France', 9),
  (_deck_id, _user_id, 'Portuguese admiral who built the Portuguese empire through fortified trading posts: Goa 1510, Malacca 1511, Hormuz 1515.', 'Afonso de Albuquerque (1453-1515)', 'Exploration - Portugal', 10),
  (_deck_id, _user_id, 'Divided the non-European world between Spain and Portugal. Moved the Line of Demarcation about 800 miles west. Ignored by other European powers.', 'Treaty of Tordesillas (1494)', 'Treaty - Spain vs Portugal', 11),
  (_deck_id, _user_id, 'France ceded Newfoundland, Nova Scotia, and Hudson Bay to Britain. Spain granted Britain the asiento (slave trade monopoly).', 'Treaty of Utrecht (1713)', 'Treaty - colonial settlement', 12),
  (_deck_id, _user_id, 'Transfer of plants, animals, and diseases between hemispheres. Disease killed about 90 percent of the indigenous population by 1600.', 'Columbian Exchange', 'System - exchange', 13),
  (_deck_id, _user_id, 'Spanish crown granted labor and tribute from indigenous people to colonists. Abolished 1720.', 'Encomienda system', 'System - Spanish labor', 14),
  (_deck_id, _user_id, 'Racial hierarchy: Peninsulares above Creoles above Mestizos above Mulattoes above Indians above Africans.', 'Casta System', 'System - hierarchy', 15),
  (_deck_id, _user_id, '12-15 million Africans transported. Middle Passage mortality 15-20 percent. Route: Europe (manufactured goods) to Africa to Americas (enslaved people) to Europe (raw materials).', 'Middle Passage and Triangular Trade', 'System - slave trade', 16),
  (_deck_id, _user_id, 'Small, maneuverable Portuguese ship. Lateen sails allowed sailing against the wind.', 'a Caravel', 'Equipment - ship', 17),
  (_deck_id, _user_id, 'Larger, heavily armed ship used for trade and colonization.', 'a Carrack', 'Equipment - ship', 18),
  (_deck_id, _user_id, 'Multi-decked Spanish ship used for transatlantic trade.', 'a Galleon', 'Equipment - ship', 19),
  (_deck_id, _user_id, 'What navigation tools were used in the Age of Exploration?', 'Compass, astrolabe, cross-staff, quadrant, and log line.', 'Equipment - navigation', 20);
  UPDATE custom_decks SET card_count = 21, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 2: Enlightenment Thinkers and Documents (17 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'Enlightenment Thinkers and Documents', 'Philosophers and key documents 18th century', 17, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Wrote Two Treatises on Government (1690). Natural rights: life, liberty, property. Right to rebel against tyrannical government. Influenced the Declaration of Independence.', 'John Locke (1632-1704)', 'Enlightenment - natural rights', 0),
  (_deck_id, _user_id, 'Wrote Leviathan (1651). Argued for absolute sovereignty to prevent chaos.', 'Thomas Hobbes (1588-1679)', 'Enlightenment - sovereignty', 1),
  (_deck_id, _user_id, 'Wrote The Spirit of Laws (1748). Separation of powers into executive, legislative, and judicial branches. Shaped the U.S. Constitution.', 'Montesquieu (1689-1755)', 'Enlightenment - separation of powers', 2),
  (_deck_id, _user_id, 'Pen name of Francois-Marie Arouet. Attacked the Church and monarchy. Advocated freedom of thought and expression.', 'Voltaire (1694-1778)', 'Enlightenment - free speech', 3),
  (_deck_id, _user_id, 'Wrote The Social Contract (1762). Legitimate authority comes from the general will. Became the bible of French revolutionary leaders.', 'Jean-Jacques Rousseau (1712-1778)', 'Enlightenment - general will', 4),
  (_deck_id, _user_id, 'Wrote On Crimes and Punishments. Argued against torture and capital punishment.', 'Cesare Beccaria (1738-1794)', 'Enlightenment - justice reform', 5),
  (_deck_id, _user_id, 'Wrote A Vindication of the Rights of Women (1792). Argued women are rational beings deserving equal rights.', 'Mary Wollstonecraft (1759-1797)', 'Enlightenment - women rights', 6),
  (_deck_id, _user_id, 'Wrote The Wealth of Nations (1776). Founder of modern economics. Free markets and the invisible hand.', 'Adam Smith (1723-1790)', 'Enlightenment - economics', 7),
  (_deck_id, _user_id, 'Scottish philosopher who developed modern attitudes toward science and religion.', 'David Hume (1711-1776)', 'Enlightenment - Scotland', 8),
  (_deck_id, _user_id, 'Defined Enlightenment as man emerging from his self-imposed immaturity.', 'Immanuel Kant (1724-1804)', 'Enlightenment - definition', 9),
  (_deck_id, _user_id, 'Advocated the inductive method: conclusions from observation.', 'Francis Bacon (1561-1626)', 'Enlightenment - method', 10),
  (_deck_id, _user_id, 'I think, therefore I am. Advocated reason over the senses.', 'Rene Descartes (1596-1650)', 'Enlightenment - reason', 11),
  (_deck_id, _user_id, 'Limited monarchy. Trial by jury. No punishment without lawful judgment.', 'Magna Carta (1215)', 'Document - limits on monarchy', 12),
  (_deck_id, _user_id, 'Free speech in Parliament. No cruel and unusual punishment.', 'English Bill of Rights (1689)', 'Document - 1689', 13),
  (_deck_id, _user_id, 'Written by Thomas Jefferson. Natural rights and right to replace government. We hold these truths to be self-evident, that all men are created equal.', 'Declaration of Independence (1776)', 'Document - 1776', 14),
  (_deck_id, _user_id, 'Three branches of government. Bill of Rights added 1791.', 'U.S. Constitution (1787)', 'Document - 1787', 15),
  (_deck_id, _user_id, 'Men are born and remain free and equal in rights.', 'French Declaration of the Rights of Man and of the Citizen (1789)', 'Document - 1789', 16);
  UPDATE custom_decks SET card_count = 17, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 3: American Revolution (20 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'American Revolution', 'Figures, battles, documents and tactics 1775-1783', 24, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Commander of the Continental Army. Held the army together through Trenton and Valley Forge. First U.S. President.', 'George Washington (1732-1799)', 'American Revolution - commander', 0),
  (_deck_id, _user_id, 'Author of the Declaration of Independence. Third U.S. President.', 'Thomas Jefferson (1743-1826)', 'American Revolution - author', 1),
  (_deck_id, _user_id, 'Scientist, printer, diplomat. Secured the French alliance (1778) that was decisive to victory.', 'Benjamin Franklin (1706-1790)', 'American Revolution - diplomat', 2),
  (_deck_id, _user_id, 'Diplomat who helped negotiate the peace treaty. Second U.S. President.', 'John Adams (1735-1826)', 'American Revolution - diplomat', 3),
  (_deck_id, _user_id, 'Hero of Saratoga who later plotted to surrender West Point to the British (1780).', 'Benedict Arnold (1741-1801)', 'American Revolution - traitor', 4),
  (_deck_id, _user_id, 'Naval commander who defeated the British frigate Serapis. Said: I have not yet begun to fight.', 'John Paul Jones (1747-1792)', 'American Revolution - navy', 5),
  (_deck_id, _user_id, 'Southern theater general who wore down Cornwallis with Fabian tactics.', 'Nathanael Greene (1742-1786)', 'American Revolution - south', 6),
  (_deck_id, _user_id, 'The Swamp Fox. Guerrilla raids on British supply lines in South Carolina.', 'Francis Marion (c. 1732-1795)', 'American Revolution - guerrilla', 7),
  (_deck_id, _user_id, 'French aristocrat. Aide to Washington who helped secure French reinforcements. Also wrote the Declaration of the Rights of Man and commanded the National Guard.', 'Marquis de Lafayette (1757-1834)', 'American Revolution - France', 8),
  (_deck_id, _user_id, 'Prussian officer who drilled the Continental Army at Valley Forge into a disciplined force.', 'Baron von Steuben (1730-1794)', 'American Revolution - training', 9),
  (_deck_id, _user_id, 'British commander in Boston at the start of the war. Ordered the Concord expedition of April 1775. Recalled to Britain after Bunker Hill.', 'General Thomas Gage (1719-1787)', 'American Revolution - British', 10),
  (_deck_id, _user_id, 'British commander who won Bunker Hill (Jun 1775) and Long Island (Aug 1776) and captured New York and Philadelphia, but failed to destroy Washington army. Resigned 1778.', 'General William Howe (1729-1814)', 'American Revolution - British', 11),
  (_deck_id, _user_id, 'British general whose army of about 6,000 surrendered at Saratoga on Oct 17, 1777. The defeat convinced France to ally with the Americans.', 'General John Burgoyne (1722-1792)', 'American Revolution - British', 12),
  (_deck_id, _user_id, 'British general who campaigned in the southern colonies and was trapped at Yorktown, surrendering about 7,000 men on Oct 19, 1781. Later Governor-General of India.', 'General Charles Cornwallis (1738-1805)', 'American Revolution - British', 13),
  (_deck_id, _user_id, 'Jean-Baptiste Donatien de Vimeur, Comte de Rochambeau. French general who brought 5,500 French troops and joined Washington at Yorktown.', 'Comte de Rochambeau (1725-1807)', 'American Revolution - France', 14),
  (_deck_id, _user_id, 'War begins. 8 Americans killed at Lexington. British column harassed on the retreat to Boston. Siege of Boston follows.', 'Lexington and Concord (Apr 19, 1775)', 'Battle - 1775', 15),
  (_deck_id, _user_id, 'British victory with about 1,000 casualties against about 400 American. Showed Americans could stand up to a professional army. Gage recalled.', 'Bunker Hill (Jun 17, 1775)', 'Battle - 1775', 16),
  (_deck_id, _user_id, 'Washington crossed the Delaware at night and captured about 900 Hessians under Colonel Rall. Revived morale after the loss of New York.', 'Trenton (Dec 26, 1776)', 'Battle - 1776', 17),
  (_deck_id, _user_id, 'Burgoyne army of about 6,000 surrendered to General Horatio Gates. Benedict Arnold was a hero of the battle. Convinced France to sign the alliance of 1778. Turning point.', 'Saratoga (Sep 19 and Oct 7, surrender Oct 17, 1777)', 'Battle - turning point', 18),
  (_deck_id, _user_id, 'Cornwallis trapped between Washington and Rochambeau on land (about 17,000) and the French fleet of Admiral de Grasse at sea. About 7,000 British surrendered. War effectively over.', 'Yorktown (Sep 28 - Oct 19, 1781)', 'Battle - 1781', 19),
  (_deck_id, _user_id, 'Thomas Paine pamphlet advocating independence. Sold about 500,000 copies.', 'Common Sense (1776)', 'Document - Paine', 20),
  (_deck_id, _user_id, 'Signed Sep 3, 1783. Britain recognized U.S. independence and ceded territory east of the Mississippi. Negotiated by Adams, Franklin, and Jay.', 'Treaty of Paris (1783)', 'Treaty - independence', 21),
  (_deck_id, _user_id, 'What tactics did the Americans use?', 'Guerrilla warfare against supply lines (Marion in South Carolina). Fabian strategy: Washington avoided large-scale battles to preserve his army. French regulars, artillery, and fleet at Yorktown.', 'Tactics - preservation', 22),
  (_deck_id, _user_id, 'Which battle convinced France to ally with the Americans?', 'Saratoga (Oct 17, 1777). Burgoyne surrender of about 6,000 troops convinced France to sign the alliance of 1778.', 'Review - Saratoga', 23);
  UPDATE custom_decks SET card_count = 24, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 4: French Revolution and Napoleon (21 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'French Revolution and Napoleon', 'Figures, events, battles and tactics 1789-1815', 21, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'King of France. Indecisive. Executed Jan 21, 1793.', 'Louis XVI (1754-1793)', 'French Revolution - king', 0),
  (_deck_id, _user_id, 'Queen of France. Austrian-born and resented as a foreigner. Executed Oct 16, 1793.', 'Marie Antoinette (1755-1793)', 'French Revolution - queen', 1),
  (_deck_id, _user_id, 'Jacobin leader. Architect of the Reign of Terror (about 40,000 executed). Guillotined Jul 28, 1794.', 'Maximilien Robespierre (1758-1794)', 'French Revolution - Terror', 2),
  (_deck_id, _user_id, 'Cordeliers Club leader. Initially radical, later urged moderation. Guillotined 1794.', 'Georges Danton (1759-1794)', 'French Revolution - Cordeliers', 3),
  (_deck_id, _user_id, 'Radical journalist. Assassinated by Charlotte Corday.', 'Jean-Paul Marat (1743-1793)', 'French Revolution - journalist', 4),
  (_deck_id, _user_id, 'Author of What is the Third Estate? Helped Napoleon seize power.', 'Emmanuel Sieyes (1748-1836)', 'French Revolution - theorist', 5),
  (_deck_id, _user_id, 'First meeting since 1614.', 'Estates-General (May 1789)', 'Event - 1789', 6),
  (_deck_id, _user_id, 'Tennis Court Oath (Jun 20, 1789): Third Estate declared itself the National Assembly. Storming of the Bastille (Jul 14, 1789): symbol of the Revolution. Declaration of the Rights of Man (Aug 26, 1789): feudal privileges abolished.', 'Tennis Court Oath, Bastille, and Declaration of 1789', 'Events - 1789', 7),
  (_deck_id, _user_id, 'Louis XVI attempted to flee and was captured. Lost public trust.', 'Flight to Varennes (Jun 1791)', 'Event - 1791', 8),
  (_deck_id, _user_id, 'What happened from the Republic to the coup by Napoleon?', 'Republic declared Sep 1792. Louis XVI executed Jan 21, 1793. Reign of Terror 1793-94. Robespierre executed Jul 28, 1794. The Directory 1795-99. Coup of 18 Brumaire Nov 9, 1799.', 'Timeline - 1792 to 1799', 9),
  (_deck_id, _user_id, 'Toulon was the first major success for Napoleon as an artillery officer. In Italy he defeated Austria, leading to the Treaty of Campo Formio.', 'Toulon (1793) and in Italy (1796-97)', 'Napoleon - early campaigns', 10),
  (_deck_id, _user_id, 'Nelson destroyed the French fleet at the Battle of the Nile.', 'Egyptian Campaign (1798-99)', 'Napoleon - Egypt', 11),
  (_deck_id, _user_id, 'Battle of the Three Emperors. Napoleon defeated Austria and Russia.', 'Austerlitz (Dec 2, 1805)', 'Napoleon - 1805', 12),
  (_deck_id, _user_id, 'Nelson destroyed the French and Spanish fleet. Britain secured naval supremacy.', 'Trafalgar (Oct 21, 1805)', 'Napoleon - naval defeat', 13),
  (_deck_id, _user_id, 'Spanish and Portuguese guerrillas plus Wellington wore down French forces.', 'Peninsular War (1808-14)', 'Napoleon - Spain', 14),
  (_deck_id, _user_id, 'About 600,000 invaded and about 100,000 returned. Scorched earth and winter destroyed the Grande Armee.', 'Russian Campaign (1812)', 'Napoleon - 1812', 15),
  (_deck_id, _user_id, 'Battle of the Nations. Coalition defeated Napoleon.', 'Leipzig (Oct 16-19, 1813)', 'Napoleon - 1813', 16),
  (_deck_id, _user_id, 'Final defeat by Wellington and Blucher. Napoleon exiled to St. Helena.', 'Waterloo (Jun 18, 1815)', 'Napoleon - final defeat', 17),
  (_deck_id, _user_id, 'Corps system: self-contained units of 15,000-30,000 men that march separately and concentrate for battle. Mass conscription (levee en masse 1793): all unmarried men 18-25 liable. Massed artillery to soften lines. March divided, fight united.', 'Napoleonic tactics', 'Napoleon - tactics', 18),
  (_deck_id, _user_id, 'All unmarried men aged 18-25 liable for military service. Enabled Napoleonic mass armies.', 'mass conscription (levee en masse 1793)', 'Napoleon - conscription', 19),
  (_deck_id, _user_id, 'Review: order these 1789 events: Bastille, Declaration, Tennis Court Oath?', 'Jun 20 Tennis Court Oath, Jul 14 Bastille, Aug 26 Declaration of the Rights of Man.', 'Review - 1789 order', 20);
  UPDATE custom_decks SET card_count = 21, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 5: 19th Century (26 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, '19th Century', 'Unification, treaties, wars and technology 1800s', 26, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Austrian Chancellor. Architect of the Congress of Vienna. Dominated European diplomacy for 30 years. Suppressed liberalism and nationalism.', 'Klemens von Metternich (1773-1859)', '19th century - diplomacy', 0),
  (_deck_id, _user_id, 'Prussian Minister-President from 1862. Unified Germany through blood and iron: three wars in 1864, 1866, 1870-71. Engineered the Ems Telegram to provoke war with France. Chancellor of the German Empire 1871-1890.', 'Otto von Bismarck (1815-1898)', '19th century - Germany', 1),
  (_deck_id, _user_id, 'Founded Young Italy (1831). Wanted a unified Italian republic.', 'Giuseppe Mazzini (1805-1872)', '19th century - Italy', 2),
  (_deck_id, _user_id, 'Prime Minister of Piedmont-Sardinia. Engineered Italian unification through diplomacy and war.', 'Count Cavour (1810-1861)', '19th century - Italy', 3),
  (_deck_id, _user_id, 'Led the Expedition of the Thousand (1860) and conquered Sicily and Naples.', 'Giuseppe Garibaldi (1807-1882)', '19th century - Italy', 4),
  (_deck_id, _user_id, 'First King of unified Italy (1861).', 'Victor Emmanuel II (1820-1878)', '19th century - Italy', 5),
  (_deck_id, _user_id, 'The Liberator. Led independence in Venezuela, Colombia, Ecuador, Peru, and Bolivia.', 'Simon Bolivar (1783-1830)', '19th century - Latin America', 6),
  (_deck_id, _user_id, 'Wrote the Communist Manifesto (1848) with Friedrich Engels. History as class struggle. Predicted workers revolution.', 'Karl Marx (1818-1883)', '19th century - communism', 7),
  (_deck_id, _user_id, 'U.S. naval officer who forced Japan to open to foreign trade (1853).', 'Commodore Matthew Perry (1794-1858)', '19th century - Japan', 8),
  (_deck_id, _user_id, 'U.S. President 1861-1865. Issued the Emancipation Proclamation (effective Jan 1, 1863). Assassinated April 14, 1865.', 'Abraham Lincoln (1809-1865)', '19th century - USA', 9),
  (_deck_id, _user_id, 'Grant (1822-1885): Union general who won Vicksburg and accepted surrender at Appomattox. Lee (1807-1870): Confederate general who lost at Gettysburg and surrendered April 9, 1865.', 'Ulysses S. Grant and Robert E. Lee', '19th century - Civil War', 10),
  (_deck_id, _user_id, 'Restored balance of power. Key decisions made by Britain, Russia, Austria, and Prussia.', 'Congress of Vienna (1815)', 'Treaty - 1815', 11),
  (_deck_id, _user_id, 'U.S. opposed European colonization in the Americas.', 'Monroe Doctrine (1823)', 'Doctrine - 1823', 12),
  (_deck_id, _user_id, 'Ended the Mexican-American War. U.S. paid 15M dollars for California, New Mexico, Arizona, Nevada, and Utah.', 'Treaty of Guadalupe Hidalgo (1848)', 'Treaty - 1848', 13),
  (_deck_id, _user_id, 'Ended the First Opium War. Hong Kong to Britain. Five ports opened.', 'Treaty of Nanking (1842)', 'Treaty - China', 14),
  (_deck_id, _user_id, 'Partitioned Africa. Established the effective occupation principle.', 'Berlin Conference (1884-85)', 'Conference - Africa', 15),
  (_deck_id, _user_id, 'About 15,000 Cherokee forced from Georgia to Oklahoma. About 4,000 died.', 'Trail of Tears (1838)', 'Event - 1838', 16),
  (_deck_id, _user_id, 'U.S. won decisive battles. Ended with the Treaty of Guadalupe Hidalgo.', 'Mexican-American War (1846-48)', 'War - 1846', 17),
  (_deck_id, _user_id, 'First women rights convention in the U.S.', 'Seneca Falls Convention (1848)', 'Event - 1848', 18),
  (_deck_id, _user_id, 'About 620,000 deaths. Gettysburg (Jul 1-3, 1863) was the turning point with about 51,000 casualties.', 'US Civil War (1861-65)', 'War - 1861', 19),
  (_deck_id, _user_id, 'Freed slaves in Confederate states.', 'Emancipation Proclamation (1863)', 'Document - 1863', 20),
  (_deck_id, _user_id, 'Prussia defeated France. German Empire proclaimed at Versailles.', 'Franco-Prussian War (1870-71)', 'War - 1870', 21),
  (_deck_id, _user_id, 'Sioux victory over Custer.', 'Battle of Little Big Horn (1876)', 'Battle - 1876', 22),
  (_deck_id, _user_id, 'How was Germany unified?', '1864 Danish War, then 1866 Austro-Prussian War, then 1870-71 Franco-Prussian War. Empire proclaimed Jan 18, 1871.', 'Unification - Germany', 23),
  (_deck_id, _user_id, 'How was Italy unified?', '1859 War with Austria, 1860 Garibaldi Thousand, 1861 Kingdom proclaimed, 1866 Venetia, 1870 Rome.', 'Unification - Italy', 24),
  (_deck_id, _user_id, 'What 19th-century technology and ideology matter most?', 'Railways, telegraph, breech-loading rifles, ironclad warships. Social Darwinism used to justify imperialism.', '19th century - tech', 25);
  UPDATE custom_decks SET card_count = 26, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 6: World War I (39 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'World War I', 'Causes, figures, battles, treaties and weapons 1914-1918', 39, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'Militarism, Alliances, Imperialism, Nationalism.', 'causes of WWI (MAIN)', 'Causes - MAIN', 0),
  (_deck_id, _user_id, 'Heir to the Austro-Hungarian throne. Assassinated June 28, 1914 in Sarajevo by Gavrilo Princip, a 19-year-old Bosnian Serb and Black Hand member.', 'Archduke Franz Ferdinand and who killed him', 'WWI - trigger', 1),
  (_deck_id, _user_id, 'German Emperor. Gave Austria-Hungary the blank check.', 'Kaiser Wilhelm II', 'WWI - Germany', 2),
  (_deck_id, _user_id, 'Russian Emperor. Mobilized against Austria-Hungary. Abdicated March 1917.', 'Tsar Nicholas II', 'WWI - Russia', 3),
  (_deck_id, _user_id, 'U.S. President. Declared war April 1917. Fourteen Points and the League of Nations.', 'Woodrow Wilson', 'WWI - USA', 4),
  (_deck_id, _user_id, 'David Lloyd George: British PM from Dec 1916, at the Paris Peace Conference. Georges Clemenceau: French Premier from Nov 1917, wanted harsh terms for Germany.', 'Lloyd George and Clemenceau', 'WWI - peace conference', 5),
  (_deck_id, _user_id, 'British commander of the BEF from Dec 1915 to 1919. Directed the Somme 1916, Passchendaele 1917, and the Hundred Days 1918.', 'Field Marshal Douglas Haig (1861-1928)', 'WWI - Britain', 6),
  (_deck_id, _user_id, 'French Commander-in-Chief 1914-1916. Author of Plan XVII. Won the First Battle of the Marne, stopping the German advance on Paris.', 'General Joseph Joffre (1852-1931)', 'WWI - France', 7),
  (_deck_id, _user_id, 'French general appointed Supreme Allied Commander on Mar 26, 1918 at Beauvais. Coordinated the offensives that ended the war.', 'Marshal Ferdinand Foch (1851-1929)', 'WWI - supreme commander', 8),
  (_deck_id, _user_id, 'French general who defended Verdun in 1916 with the order They shall not pass. Later head of Vichy France in WWII.', 'General Philippe Petain (1856-1951)', 'WWI - Verdun', 9),
  (_deck_id, _user_id, 'Commander of the American Expeditionary Forces. Led Belleau Wood and the Meuse-Argonne offensive with 1.2 million Americans.', 'General John J. Pershing (1860-1948)', 'WWI - USA', 10),
  (_deck_id, _user_id, 'German commander who with Ludendorff won Tannenberg 1914. Chief of the General Staff from Aug 1916. Later President of Germany.', 'Field Marshal Paul von Hindenburg (1847-1934)', 'WWI - Germany', 11),
  (_deck_id, _user_id, 'German Quartermaster-General who effectively directed the war effort 1916-1918. Planned the 1918 Spring Offensives that failed.', 'General Erich Ludendorff (1865-1937)', 'WWI - Germany', 12),
  (_deck_id, _user_id, 'German Chief of Staff 1914-1916. Planned Verdun to bleed France white. Dismissed Aug 1916 after the Somme.', 'General Erich von Falkenhayn (1861-1922)', 'WWI - Verdun planner', 13),
  (_deck_id, _user_id, 'German commander of the High Seas Fleet from Jan 1916. Led the German fleet at the Battle of Jutland.', 'Admiral Reinhard Scheer (1863-1928)', 'WWI - Jutland German', 14),
  (_deck_id, _user_id, 'German battlecruiser commander. Led the Dogger Bank raid and the battlecruiser force at Jutland.', 'Admiral Franz von Hipper (1863-1932)', 'WWI - Jutland German', 15),
  (_deck_id, _user_id, 'Ottoman commander who organized the defense against the ANZAC landing at Gallipoli in 1915. Later became Ataturk, founder of Turkey in 1923.', 'Mustafa Kemal (1881-1938) in WWI', 'WWI - Ottoman', 16),
  (_deck_id, _user_id, 'The Red Baron. German fighter ace with 80 confirmed kills flying Fokker triplanes. Killed Apr 21, 1918 over the Somme.', 'Manfred von Richthofen (1892-1918)', 'WWI - Red Baron', 17),
  (_deck_id, _user_id, 'Born Margaretha Zelle. Dutch exotic dancer accused of spying for Germany. Executed by firing squad Oct 15, 1917 at Vincennes.', 'Mata Hari (1876-1917)', 'WWI - spy', 18),
  (_deck_id, _user_id, 'Russia exited the war. Negotiated by Trotsky against German General Hoffmann. Russia ceded Poland, the Baltic states, Ukraine, and Finland: about 1 million square miles and 60 million people.', 'Treaty of Brest-Litovsk (Mar 3, 1918)', 'Treaty - Russia exits', 19),
  (_deck_id, _user_id, 'What did the Treaty of Versailles (Jun 28, 1919) impose on Germany?', 'Article 231 War Guilt Clause. Army max 100,000 with no conscription, tanks, military aircraft, or submarines. Reparations 132 billion gold marks. Alsace-Lorraine returned to France. Rhineland demilitarized. 13 percent of territory and all colonies lost.', 'Treaty - Versailles', 20),
  (_deck_id, _user_id, 'Saint-Germain (Sep 10, 1919): Austria lost Bohemia, Moravia, Slovenia, and Dalmatia and was forbidden union with Germany. Trianon (Jun 4, 1920): Hungary lost two thirds of territory and 60 percent of population. Sevres (Aug 10, 1920): Ottoman Empire partitioned among Britain, France, Greece, and new states.', 'Treaties of Saint-Germain, Trianon, and Sevres', 'Treaties - other Central Powers', 21),
  (_deck_id, _user_id, 'German plan by Alfred von Schlieffen (1905), modified by Moltke: sweep through Belgium to encircle Paris in 6 weeks while holding Russia. Failed at the Marne; caused the invasion of Belgium that brought Britain into the war.', 'Schlieffen Plan', 'Plan - Schlieffen', 22),
  (_deck_id, _user_id, 'Joffre counterattacked the German armies of Kluck and Bulow 40 km from Paris, using 600 Paris taxis to rush troops. Moltke ordered retreat. End of the Schlieffen Plan and start of trench warfare. About 500,000 casualties both sides.', 'First Battle of the Marne (Sep 6-10, 1914)', 'Battle - Marne', 23),
  (_deck_id, _user_id, 'Hindenburg and Ludendorff encircled the Russian 2nd Army of Samsonov in East Prussia while Rennenkampf failed to help. About 170,000 Russian casualties. Major German victory on the Eastern Front.', 'Tannenberg (Aug 26-30, 1914)', 'Battle - Tannenberg', 24),
  (_deck_id, _user_id, 'Allied landing by Hamilton with ANZAC, British, and French troops to knock the Ottomans out and open the Dardanelles. Kemal organized the defense. Stalemate, then full evacuation. About 500,000 casualties both sides. Failed.', 'Gallipoli Campaign (Apr 25, 1915 - Jan 9, 1916)', 'Battle - Gallipoli', 25),
  (_deck_id, _user_id, 'Falkenhayn attacked to bleed France white. Petain defended with the order They shall not pass, rotating divisions through. Forts Douaumont and Vaux changed hands. About 300,000 dead and 700,000 casualties. French held.', 'Verdun (Feb 21 - Dec 18, 1916)', 'Battle - Verdun', 26),
  (_deck_id, _user_id, 'Haig and Rawlinson attacked after a week-long bombardment. First day: 57,470 British casualties, worst in British history. First tanks used Sep 15 at Flers. About 1 million casualties. Minimal gains.', 'Somme (Jul 1 - Nov 18, 1916)', 'Battle - Somme', 27),
  (_deck_id, _user_id, 'Jellicoe and Beatty met Scheer and Hipper with 250 warships, the largest naval battle of WWI. Britain lost 14 ships and 6,094 men, Germany 11 ships and 2,551. German fleet never sortied again: strategic British victory.', 'Jutland (May 31 - Jun 1, 1916)', 'Battle - Jutland', 28),
  (_deck_id, _user_id, 'Haig attacked the Rupprecht lines in Flanders. Heaviest rain in memory turned the battlefield into mud. Canadians under Currie took the village Nov 6. About 500,000 casualties. Inconclusive.', 'Passchendaele / Third Ypres (Jul 31 - Nov 10, 1917)', 'Battle - Passchendaele', 29),
  (_deck_id, _user_id, 'U.S. 2nd Division including Marines stopped the German drive on Paris at Chateau-Thierry. About 9,777 American casualties. Defining moment for the U.S. Marines.', 'Belleau Wood (Jun 1-26, 1918)', 'Battle - Belleau Wood', 30),
  (_deck_id, _user_id, 'Pershing led 1.2 million Americans against the Hindenburg Line. About 26,277 dead and 120,000 casualties. Largest U.S. operation of WWI. Included the Lost Battalion and Sergeant York.', 'Meuse-Argonne Offensive (Sep 26 - Nov 11, 1918)', 'Battle - Meuse-Argonne', 31),
  (_deck_id, _user_id, 'Foch coordinated Allied offensives starting at Amiens, Ludendorff called Aug 8 the Black Day of the German Army. Continuous retreat, Kiel mutiny, Kaiser abdicated Nov 9, Armistice Nov 11 at 11:00.', 'Hundred Days Offensive (Aug 8 - Nov 11, 1918)', 'Offensive - 1918', 32),
  (_deck_id, _user_id, 'Built under Admiral Fisher. 18,120 tons, 10 twelve-inch guns in 5 turrets, steam turbine 21 knots. All-big-gun design made all earlier battleships obsolete and started the naval arms race.', 'HMS Dreadnought (1906)', 'Ship - Dreadnought', 33),
  (_deck_id, _user_id, 'Ocean-going diesel-electric submarine: 808 tons surfaced, 12 torpedoes, one 10.5 cm deck gun. Unrestricted warfare announced Jan 31, 1917 sank neutral shipping and was a direct cause of U.S. entry after the Lusitania sinking of May 7, 1915.', 'German U-boat Type U-81', 'Ship - U-boat', 34),
  (_deck_id, _user_id, 'First true aircraft carrier with a full flush flight deck. Commissioned Sep 1918, too late for combat in WWI.', 'HMS Argus (1918)', 'Ship - carrier', 35),
  (_deck_id, _user_id, 'Based at Scapa Flow under Jellicoe: 22 dreadnoughts, 9 battlecruisers, 40 pre-dreadnoughts, 121 cruisers, 221 destroyers, 73 submarines. Maintained the blockade that starved Germany.', 'British Grand Fleet in WWI', 'Fleet - composition', 36),
  (_deck_id, _user_id, 'Mark I by Tritton and Wilson: 28 tons, 6 mph, two 6-pounder guns plus machine guns, first used at Flers Sep 15, 1916. Renault FT by Estienne: 7 tons, first rotating turret, 37 mm gun, 8 km per hour, over 3,000 built.', 'Mark I (1916) and Renault FT (1917) tanks', 'Tanks - WWI', 37),
  (_deck_id, _user_id, 'What new weapons and tactics defined WWI?', 'Machine guns (Maxim, Vickers): 450-600 rounds per minute, forced trench warfare. Poison gas: chlorine Apr 1915, phosgene 1915, mustard gas 1917. Stormtroopers (Stosstruppen): German infiltration elite, precursor to Blitzkrieg. Tanks, aircraft, convoys, and wireless completed the modern battlefield.', 'Weapons - WWI', 38);
  UPDATE custom_decks SET card_count = 39, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 7: World War II (95 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'World War II', 'Figures, operations, battles, equipment 1939-1945', 95, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'How many died in WWII?', 'About 60 million total: 25M military, 35M civilian. The Holocaust murdered 6 million Jews and 11 million total victims.', 'WWII - deaths', 0),
  (_deck_id, _user_id, 'Austrian-born Fuhrer of Germany. Chancellor from Jan 30, 1933. Rearmed in violation of Versailles, annexed Austria and Czechoslovakia, started WWII with Poland. Committed suicide Apr 30, 1945 in the Berlin bunker.', 'Adolf Hitler (1889-1945)', 'WWII - Germany', 1),
  (_deck_id, _user_id, 'Duce of Italy. Founded fascism, took power in the March on Rome 1922. Allied with Hitler, lost in Africa and Italy. Executed by Italian partisans Apr 28, 1945 at Lake Como.', 'Benito Mussolini (1883-1945)', 'WWII - Italy', 2),
  (_deck_id, _user_id, 'Emperor of Japan 1926-1989. Announced the surrender in the radio broadcast of Aug 15, 1945. Kept on the throne under U.S. occupation.', 'Emperor Hirohito (1901-1989)', 'WWII - Japan', 3),
  (_deck_id, _user_id, 'Japanese Prime Minister Oct 1941 - Jul 1944. Ordered the Pearl Harbor attack of Dec 7, 1941. Convicted at the Tokyo Trials and executed Dec 23, 1948.', 'Hideki Tojo (1884-1948)', 'WWII - Japan', 4),
  (_deck_id, _user_id, 'The Desert Fox. Commanded the Afrika Korps 1941-43, defeated at El Alamein. Defended Normandy in 1944. Linked to the Jul 20 plot, forced to commit suicide Oct 14, 1944.', 'Erwin Rommel (1891-1944)', 'WWII - Germany', 5),
  (_deck_id, _user_id, 'Architect of Blitzkrieg. Wrote Achtung Panzer in 1937. Led the 19th Panzer Corps through the Ardennes to the Channel in May 1940.', 'Heinz Guderian (1888-1954)', 'WWII - Blitzkrieg', 6),
  (_deck_id, _user_id, 'German general who designed the Sichelschnitt plan for the 1940 invasion of France. Conquered Crimea 1942, retook Kharkov 1943.', 'Erich von Manstein (1887-1973)', 'WWII - German general', 7),
  (_deck_id, _user_id, 'Commander of the German 6th Army at Stalingrad. Surrendered with 91,000 men on Feb 2, 1943. First German field marshal taken prisoner.', 'Friedrich Paulus (1890-1957)', 'WWII - Stalingrad', 8),
  (_deck_id, _user_id, 'Commander of German U-boats and wolfpack tactics. Succeeded Hitler as President for 23 days in May 1945. Sentenced to 10 years at Nuremberg.', 'Karl Donitz (1891-1980)', 'WWII - U-boats', 9),
  (_deck_id, _user_id, 'British Prime Minister May 1940 - Jul 1945 and 1951-55. Blood, toil, tears and sweat and We shall fight on the beaches speeches. Held Britain in the war in 1940.', 'Winston Churchill (1874-1965)', 'WWII - Britain', 10),
  (_deck_id, _user_id, 'U.S. President 1933-1945. New Deal, Lend-Lease, Atlantic Charter. Died Apr 12, 1945 at Warm Springs, before victory.', 'Franklin D. Roosevelt (1882-1945)', 'WWII - USA', 11),
  (_deck_id, _user_id, 'U.S. President 1945-1953. Authorized the atomic bombings, Marshall Plan, NATO, and the Korean War intervention.', 'Harry S. Truman (1884-1972)', 'WWII - USA', 12),
  (_deck_id, _user_id, 'Soviet Premier. Five-Year Plans and purges in the 1930s. Signed the Nazi-Soviet Pact 1939, then joined the Allies after the German invasion of Jun 1941. Demanded the second front.', 'Joseph Stalin (1878-1953)', 'WWII - USSR', 13),
  (_deck_id, _user_id, 'Supreme Allied Commander in Europe. Planned and executed Operation Overlord. Later U.S. President 1953-1961.', 'Dwight D. Eisenhower (1890-1969)', 'WWII - supreme commander', 14),
  (_deck_id, _user_id, 'British general who won El Alamein in Nov 1942 against Rommel. Commanded the failed Market Garden airborne operation and the Rhine crossing.', 'Bernard Montgomery (1887-1976)', 'WWII - Britain', 15),
  (_deck_id, _user_id, 'U.S. Third Army commander. Raced across France 1944 and relieved Bastogne during the Bulge. Died Dec 1945 after a car accident.', 'George S. Patton (1885-1945)', 'WWII - USA', 16),
  (_deck_id, _user_id, 'U.S. commander in the Pacific. Left the Philippines 1942 vowing I shall return. Returned at Leyte 1944 and accepted the Japanese surrender. Later commanded in Korea.', 'Douglas MacArthur (1880-1964)', 'WWII - Pacific', 17),
  (_deck_id, _user_id, 'Commander of the U.S. Pacific Fleet after Pearl Harbor. Won Midway and the Central Pacific campaign. Signed for the U.S. aboard the Missouri.', 'Chester Nimitz (1885-1966)', 'WWII - Pacific', 18),
  (_deck_id, _user_id, 'Soviet general. Defended Moscow 1941, counterattacked at Stalingrad, won Kursk, and captured Berlin 1945.', 'Georgy Zhukov (1896-1974)', 'WWII - USSR', 19),
  (_deck_id, _user_id, 'Leader of the Free French Forces from the Jun 18, 1940 London appeal. Marched into liberated Paris 1944. Later President of France.', 'Charles de Gaulle (1890-1970)', 'WWII - France', 20),
  (_deck_id, _user_id, 'U.S. Army Chief of Staff in WWII. As Secretary of State created the Marshall Plan. Nobel Peace Prize 1953.', 'George C. Marshall (1880-1959)', 'WWII - USA', 21),
  (_deck_id, _user_id, 'Japanese admiral who planned the Pearl Harbor attack. Lost at Midway. Killed Apr 18, 1943 when U.S. fighters ambushed his plane over Bougainville in Operation Vengeance.', 'Isoroku Yamamoto (1884-1943)', 'WWII - Japan', 22),
  (_deck_id, _user_id, 'Britain, France, Germany, and Italy gave Hitler the Sudetenland of Czechoslovakia. Chamberlain claimed peace for our time. Hitler broke the promise within six months by taking Prague in Mar 1939.', 'Munich Agreement (Sep 30, 1938)', 'Treaty - Munich', 23),
  (_deck_id, _user_id, 'Signed by Ribbentrop and Molotov. Public nonaggression plus a secret protocol dividing Poland and the Baltic states. Let Hitler invade Poland on Sep 1, 1939. Broken by Barbarossa in 1941.', 'Nazi-Soviet Nonaggression Pact (Aug 23, 1939)', 'Treaty - 1939 pact', 24),
  (_deck_id, _user_id, 'Axis alliance of Germany, Italy, and Japan signed in Berlin. Promised mutual aid if any faced a new enemy, aimed at deterring the United States.', 'Tripartite Pact (Sep 27, 1940)', 'Alliance - Axis', 25),
  (_deck_id, _user_id, 'Anglo-American war aims by Roosevelt and Churchill at Newfoundland: no territorial gains, self-determination, free trade, freedom of the seas, and a postwar peace organization.', 'Atlantic Charter (Aug 14, 1941)', 'Charter - 1941', 26),
  (_deck_id, _user_id, 'U.S. lent or leased 50 billion dollars of arms, ships, and supplies to Britain, USSR, China, and others. Called the arsenal of democracy. Ended U.S. neutrality in practice.', 'Lend-Lease Act (Mar 11, 1941)', 'Aid - Lend-Lease', 27),
  (_deck_id, _user_id, 'What was decided at Yalta (Feb 4-11, 1945)?', 'Roosevelt, Churchill, and Stalin divided Germany and Berlin into four occupation zones, set up the United Nations, and agreed the USSR would enter the war against Japan. Poland borders and government left disputed.', 'Conference - Yalta', 28),
  (_deck_id, _user_id, 'What was decided at Potsdam (Jul 17 - Aug 2, 1945)?', 'Truman, Churchill/Attlee, and Stalin issued the Potsdam Declaration ultimatum to Japan, confirmed German demilitarization and reparations, and set the Oder-Neisse line for Poland.', 'Conference - Potsdam', 29),
  (_deck_id, _user_id, 'D-Day: Allied invasion of Normandy under Eisenhower. 156,000 men landed on 5 beaches against the Atlantic Wall. Breakout at Saint-Lo in July led to the liberation of Paris on Aug 25.', 'Operation Overlord (Jun 6, 1944)', 'Operation - Overlord', 30),
  (_deck_id, _user_id, 'Naval phase of Overlord: over 5,300 ships and landing craft plus 11,000 aircraft. Largest amphibious operation in history, commanded by Admiral Ramsay.', 'Operation Neptune (Jun 6, 1944)', 'Operation - Neptune', 31),
  (_deck_id, _user_id, 'German invasion of the USSR with about 3 million troops on a 1,800-mile front. Encircled millions at Kiev and Vyazma but stalled at Moscow in December. Largest invasion in history.', 'Operation Barbarossa (Jun 22, 1941)', 'Operation - Barbarossa', 32),
  (_deck_id, _user_id, 'Allied invasion of Morocco and Algeria under Eisenhower. First major U.S. operation in the West. French Vichy forces joined the Allies. Led to the Tunisian campaign.', 'Operation Torch (Nov 8, 1942)', 'Operation - Torch', 33),
  (_deck_id, _user_id, 'Allied invasion of Sicily by Patton and Montgomery. Toppled Mussolini on Jul 25. Opened the Italian campaign.', 'Operation Husky (Jul 10, 1943)', 'Operation - Husky', 34),
  (_deck_id, _user_id, 'Soviet offensive that destroyed German Army Group Center in Belorussia. About 450,000 German casualties. Greatest Soviet victory, timed with Normandy.', 'Operation Bagration (Jun 22 - Aug 19, 1944)', 'Operation - Bagration', 35),
  (_deck_id, _user_id, 'Montgomery airborne attempt to seize Dutch bridges to the Rhine. Called A Bridge Too Far. Failed at Arnhem with 17,000 Allied casualties.', 'Operation Market Garden (Sep 17-25, 1944)', 'Operation - Market Garden', 36),
  (_deck_id, _user_id, 'Dunkirk evacuation: 338,000 British and French troops lifted by 800 vessels including civilian little ships after the German breakthrough to the Channel.', 'Operation Dynamo (May 26 - Jun 4, 1940)', 'Operation - Dunkirk', 37),
  (_deck_id, _user_id, 'German Ardennes offensive, the Battle of the Bulge: 200,000 Germans hit the U.S. line in fog. Bastogne held, Patton relieved it. Last German offensive in the West.', 'Operation Wacht am Rhein (Dec 16, 1944)', 'Operation - Bulge', 38),
  (_deck_id, _user_id, 'Planned German invasion of Britain for Sep 1940. Cancelled after the RAF won the Battle of Britain and the Kriegsmarine could not control the Channel. Never executed.', 'Operation Sea Lion', 'Operation - Sea Lion', 39),
  (_deck_id, _user_id, 'Mass German air attack on Allied airbases in support of the Bulge. Destroyed planes on the ground but lost irreplaceable pilots. Failed and crippled the Luftwaffe.', 'Operation Bodenplatte (Jan 1, 1945)', 'Operation - Bodenplatte', 40),
  (_deck_id, _user_id, 'U.S. landing on Guadalcanal, the first American offensive in the Pacific. Marines seized Henderson Field. Six months of jungle and naval fighting ended Feb 9, 1943.', 'Operation Watchtower (Aug 7, 1942)', 'Operation - Guadalcanal', 41),
  (_deck_id, _user_id, 'U.S. invasion of Iwo Jima by 70,000 Marines against 21,000 Japanese under Kuribayashi. Flag raised on Mount Suribachi Feb 23. About 6,800 Americans and nearly all Japanese dead.', 'Operation Detachment (Feb 19, 1945)', 'Operation - Iwo Jima', 42),
  (_deck_id, _user_id, 'U.S. invasion of Okinawa with 180,000 troops. Kamikazes sank 36 ships. About 12,000 Americans and 100,000 Japanese dead by Jun 22. Last great battle, shaped the atomic decision.', 'Operation Iceberg (Apr 1, 1945)', 'Operation - Okinawa', 43),
  (_deck_id, _user_id, 'Chuikov 62nd Army held the Volga city against Paulus 6th Army in house-to-house fighting. Zhukov encircled 300,000 Axis troops in Operation Uranus. 91,000 Germans captured. About 2 million casualties. Turning point of the Eastern Front.', 'Stalingrad (Aug 23, 1942 - Feb 2, 1943)', 'Battle - Stalingrad', 44),
  (_deck_id, _user_id, 'Germany attacked the Kursk salient with 900,000 men and 2,700 tanks including new Panthers and Tigers. Soviets under Zhukov held at Prokhorovka, the largest tank clash ever, then counterattacked. About 6,000 tanks and 2 million men engaged. Germany lost the initiative for good.', 'Kursk (Jul 5 - Aug 23, 1943)', 'Battle - Kursk', 45),
  (_deck_id, _user_id, 'Nimitz, warned by codebreakers, ambushed Nagumo carriers. Dauntless dive bombers sank Akagi, Kaga, Soryu, and Hiryu; U.S. lost Yorktown. Japan lost 4 carriers and its naval pilots. Turning point of the Pacific.', 'Midway (Jun 4-7, 1942)', 'Battle - Midway', 46),
  (_deck_id, _user_id, 'First naval battle fought entirely by carrier aircraft. U.S. lost Lexington, Japan lost Shoho, and Shokaku was damaged. Stopped the Japanese invasion of Port Moresby and saved Australia.', 'Coral Sea (May 4-8, 1942)', 'Battle - Coral Sea', 47),
  (_deck_id, _user_id, 'First U.S. ground offensive: Marines took Henderson Field. Six months of jungle combat plus night naval battles like Savo Island and air battles (Cactus Air Force). Japan evacuated. Strategic initiative passed to the Allies.', 'Guadalcanal (Aug 7, 1942 - Feb 9, 1943)', 'Battle - Guadalcanal', 48),
  (_deck_id, _user_id, 'Largest naval battle in history: 282 ships. Halsey sank Kurita battleships at Sibuyan Sea, escort carriers stopped Kurita off Samar, Oldendorf destroyed Nishimura at Surigao Strait. Kamikazes first appeared. Japan ceased to be a naval power.', 'Leyte Gulf (Oct 23-26, 1944)', 'Battle - Leyte Gulf', 49),
  (_deck_id, _user_id, '70,000 Marines against 21,000 Japanese dug into tunnels under Kuribayashi. Flag raised on Mount Suribachi Feb 23 in the famous photo. About 6,800 Americans dead and nearly all defenders dead. Gave the U.S. a bomber emergency base.', 'Iwo Jima (Feb 19 - Mar 26, 1945)', 'Battle - Iwo Jima', 50),
  (_deck_id, _user_id, '180,000 U.S. troops against 100,000 Japanese. Mass kamikaze attacks sank 36 ships and damaged 368. About 12,000 Americans and 100,000 Japanese dead plus 100,000 civilians. Bloodiest Pacific battle; convinced leaders invasion of Japan would be catastrophic.', 'Okinawa (Apr 1 - Jun 22, 1945)', 'Battle - Okinawa', 51),
  (_deck_id, _user_id, '156,000 Allied troops landed in Normandy under Eisenhower against Rommel Atlantic Wall. About 10,000 Allied casualties. Beachheads linked, breakout at Saint-Lo, Paris liberated Aug 25.', 'D-Day (Jun 6, 1944)', 'Battle - D-Day', 52),
  (_deck_id, _user_id, 'Utah (U.S. 4th Division, 23,000 men, light losses). Omaha (U.S. 1st and 29th, 34,000 men, about 2,000 casualties on the bluffs). Gold (British 50th, 25,000). Juno (Canadian 3rd, 21,000, about 1,000 casualties). Sword (British 3rd, 29,000).', '5 D-Day beaches and their casualties', 'D-Day - beaches', 53),
  (_deck_id, _user_id, '200,000 Germans under Model hit the thin U.S. Ardennes line in fog. Bastogne 101st Airborne held with the Nuts reply. Patton Third Army relieved it. About 89,000 U.S. casualties. Last German offensive in the West.', 'Battle of the Bulge (Dec 16, 1944 - Jan 25, 1945)', 'Battle - Bulge', 54),
  (_deck_id, _user_id, '2.5 million Soviets under Zhukov and Konev stormed the city against 800,000 defenders. Hitler committed suicide Apr 30. Weidling surrendered May 2. Germany surrendered May 7-8. About 400,000 casualties.', 'Battle of Berlin (Apr 16 - May 2, 1945)', 'Battle - Berlin', 55),
  (_deck_id, _user_id, 'Goering Luftwaffe of 2,600 planes tried to destroy Dowding RAF of 640 fighters and force surrender. Radar, Spitfires, and Hurricanes won. About 1,700 German planes lost. First major German defeat; Sea Lion cancelled.', 'Battle of Britain (Jul 10 - Oct 31, 1940)', 'Battle - Britain', 56),
  (_deck_id, _user_id, 'Donitz U-boats with wolfpack tactics tried to starve Britain by sinking convoys: 3,500 merchant ships lost. Convoys, escort carriers, sonar, and codebreaking turned the tide by May 1943. Longest continuous battle of the war.', 'Battle of the Atlantic (1939-1945)', 'Battle - Atlantic', 57),
  (_deck_id, _user_id, 'Montgomery Eighth Army of 195,000 attacked Rommel Panzer Army of 116,000 at the Egyptian bottleneck. Minefields, artillery, and air power broke through. Axis retreat across Libya. Turning point in North Africa; Churchill called it the end of the beginning.', 'El Alamein (Oct 23 - Nov 4, 1942)', 'Battle - El Alamein', 58),
  (_deck_id, _user_id, 'German medium tank: 25 tons, 75 mm gun, 26 mph. Workhorse of the Panzer divisions with about 8,500 built. Served on all fronts 1939-1945.', 'Panzer IV', 'Tank - Panzer IV', 59),
  (_deck_id, _user_id, 'German heavy tank by Henschel, 1942: 58.9 tons, 88 mm gun, 100 mm frontal armor, 24 mph. Feared on all fronts but only 1,347 built because of cost and complexity.', 'Tiger I', 'Tank - Tiger I', 60),
  (_deck_id, _user_id, 'German heavy tank 1944: 68 tons, long 88 mm gun, 180 mm sloped armor. Strongest tank of the war but too heavy, too few (492), and too thirsty for fuel.', 'Tiger II (King Tiger)', 'Tank - Tiger II', 61),
  (_deck_id, _user_id, 'German medium tank 1943: 45.5 tons, long 75 mm gun, sloped armor, 46 mph. Best all-round German tank with 6,000 built. Rushed into Kursk with breakdown problems.', 'Panther', 'Tank - Panther', 62),
  (_deck_id, _user_id, 'Soviet medium tank by Koshkin, 1940: 26 tons, 76.2 mm gun, sloped armor, wide tracks, 55 km per hour. About 80,000 built. Best-balanced tank of the war and backbone of Soviet victory.', 'T-34', 'Tank - T-34', 63),
  (_deck_id, _user_id, 'Soviet heavy tank 1943: 46 tons, huge 122 mm gun that could kill Tigers and Panthers. Named for Joseph Stalin. About 3,800 built for breakthrough assaults.', 'IS-2', 'Tank - IS-2', 64),
  (_deck_id, _user_id, 'American medium tank: 30 tons, 75 mm (later 76 mm) gun, 38 mph. About 49,000 built. Reliable and numerous but outgunned by German heavies; won through numbers, air power, and logistics.', 'M4 Sherman', 'Tank - Sherman', 65),
  (_deck_id, _user_id, 'British heavy infantry tank: slow but heavily armored, excellent at climbing. Served from Dieppe 1942 through Korea. Carried 6-pounder then 75 mm guns.', 'Churchill tank', 'Tank - Churchill', 66),
  (_deck_id, _user_id, 'British fighter by R.J. Mitchell, 1938: Rolls-Royce Merlin engine, 370 mph, 8 machine guns (later cannon). Star of the Battle of Britain with 20,000 built.', 'Supermarine Spitfire', 'Aircraft - Spitfire', 67),
  (_deck_id, _user_id, 'British fighter that actually shot down more planes in the Battle of Britain than the Spitfire. Sturdy 8-gun monoplane, backbone of Fighter Command in 1940.', 'Hawker Hurricane', 'Aircraft - Hurricane', 68),
  (_deck_id, _user_id, 'German fighter by Willy Messerschmitt, 1937: 350 plus mph, 20 mm cannon plus 2 machine guns. Main Luftwaffe fighter with 35,000 built, most-produced fighter ever.', 'Messerschmitt Bf 109', 'Aircraft - Bf 109', 69),
  (_deck_id, _user_id, 'German radial-engine fighter 1941 that outclassed the Spitfire V on arrival. Superb fighter-bomber on all fronts with 20,000 built.', 'Focke-Wulf Fw 190', 'Aircraft - Fw 190', 70),
  (_deck_id, _user_id, 'Japanese carrier fighter 1940: exceptional range and maneuverability, dominated 1941-42. Fragile with no armor; outclassed by Hellcats and Corsairs from 1943.', 'Mitsubishi A6M Zero', 'Aircraft - Zero', 71),
  (_deck_id, _user_id, 'American long-range escort fighter with drop tanks that could reach Berlin and back. Won air superiority over Germany in 1944. Arguably the best fighter of the war.', 'P-51 Mustang', 'Aircraft - Mustang', 72),
  (_deck_id, _user_id, 'American heavy fighter-bomber: 8 fifty-caliber machine guns, rugged radial engine. Devastating ground-attack plane after D-Day with 15,000 built.', 'P-47 Thunderbolt', 'Aircraft - Thunderbolt', 73),
  (_deck_id, _user_id, 'First operational jet fighter, 1944: 540 mph, 30 mm cannon. Too late and too few (1,400) to stop Allied bombing; Hitler wasted it as a bomber.', 'Messerschmitt Me 262', 'Aircraft - Me 262', 74),
  (_deck_id, _user_id, 'American heavy bomber: 4 engines, 13 machine guns, Norden bombsight. Daylight bombing of Germany 1942-45 with 12,000 built. Memphis Belle fame.', 'B-17 Flying Fortress', 'Aircraft - B-17', 75),
  (_deck_id, _user_id, 'American super-bomber: pressurized, 350 mph, computer-aimed guns. Firebombed Japan and dropped both atomic bombs from Tinian. Enola Gay and Bockscar.', 'B-29 Superfortress', 'Aircraft - B-29', 76),
  (_deck_id, _user_id, 'British 4-engine night heavy bomber: huge bomb bay, carried the bouncing bombs of the Dambusters raid 1943. Backbone of Bomber Command with 7,300 built.', 'Avro Lancaster', 'Aircraft - Lancaster', 77),
  (_deck_id, _user_id, 'German dive bomber with screaming sirens: precise tank-killer in Poland, France, and Russia 1939-41. Too slow against modern fighters after the Battle of Britain.', 'Junkers Ju 87 Stuka', 'Aircraft - Stuka', 78),
  (_deck_id, _user_id, 'American dive bomber that sank all 4 Japanese carriers at Midway in 6 minutes on Jun 4, 1942. Slow but deadly accurate naval bomber.', 'SBD Dauntless', 'Aircraft - Dauntless', 79),
  (_deck_id, _user_id, 'German battleship 1940: 51,000 tons, 8 fifteen-inch guns. Sank HMS Hood May 24, 1941, then was hunted and sunk May 27 with 2,200 crew.', 'battleship Bismarck', 'Ship - Bismarck', 80),
  (_deck_id, _user_id, 'Japanese super-battleship: 72,000 tons, 9 eighteen-inch guns, biggest ever built. Sunk by U.S. carrier planes Apr 7, 1945 on a suicide run to Okinawa with 3,000 crew.', 'battleship Yamato', 'Ship - Yamato', 81),
  (_deck_id, _user_id, 'American carrier that fought at Midway, Eastern Solomons, Santa Cruz, Guadalcanal, and Leyte. Most decorated U.S. ship of WWII with 20 battle stars.', 'USS Enterprise (CV-6)', 'Ship - Enterprise', 82),
  (_deck_id, _user_id, 'American carrier damaged at Coral Sea, rushed back in 3 days, then sunk at Midway Jun 7, 1942 by submarine after air attacks. Her planes helped sink Soryu.', 'USS Yorktown (CV-5)', 'Ship - Yorktown', 83),
  (_deck_id, _user_id, 'Which 4 Japanese carriers were lost at Midway?', 'Akagi, Kaga, Soryu, and Hiryu: all sunk Jun 4, 1942 by Enterprise and Yorktown dive bombers while refueling planes. Japan lost its elite naval air arm in one day.', 'Ships - Midway carriers', 84),
  (_deck_id, _user_id, 'German medium submarine, backbone of the wolfpacks: 769 tons surfaced, 14 torpedoes, 88 mm deck gun. 700 built. Sank most Allied shipping before the May 1943 turning point.', 'Type VII U-boat', 'Ship - Type VII', 85),
  (_deck_id, _user_id, 'American landing craft: 36 ft, carried 36 troops or a jeep with a front ramp. 23,000 built. Eisenhower called Higgins the man who won the war for us.', 'LCVP Higgins boat', 'Ship - Higgins boat', 86),
  (_deck_id, _user_id, 'Iowa-class battleship: 58,000 tons, 9 sixteen-inch guns. Japan formally surrendered on her deck in Tokyo Bay on Sep 2, 1945 before MacArthur and Nimitz.', 'USS Missouri (BB-63)', 'Ship - Missouri', 87),
  (_deck_id, _user_id, 'German lightning war: Panzer spearheads plus Stuka dive bombers plus motorized infantry plus radio, bypassing strongpoints and encircling armies. Crushed Poland 1939 and France 1940. Designed by Guderian and Manstein.', 'Blitzkrieg', 'Tactic - Blitzkrieg', 88),
  (_deck_id, _user_id, 'Island-Hopping: Nimitz and MacArthur seized key islands and bypassed others to strangle Japan. Wolfpack: Donitz groups of U-boats that converged by radio on convoys at night.', 'Island-Hopping and Wolfpacks', 'Tactics - Pacific and Atlantic', 89),
  (_deck_id, _user_id, 'Kamikaze: Japanese suicide pilots from Oct 1944 who sank 36 ships at Okinawa. Total War: full economic mobilization with rationing, women workers, and propaganda in all major powers.', 'Kamikaze and Total War', 'Tactics - sacrifice and home front', 90),
  (_deck_id, _user_id, 'B-29 Enola Gay of Colonel Tibbets dropped the uranium gun-type bomb Little Boy: 15 kilotons. About 70,000 killed instantly, 140,000 total. First combat atomic bombing.', 'Hiroshima (Aug 6, 1945)', 'Atomic - Hiroshima', 91),
  (_deck_id, _user_id, 'B-29 Bockscar dropped the plutonium implosion bomb Fat Man: 21 kilotons. About 40,000 killed instantly. Japan announced surrender Aug 15 and signed Sep 2.', 'Nagasaki (Aug 9, 1945)', 'Atomic - Nagasaki', 92),
  (_deck_id, _user_id, 'Nazis murdered 6 million Jews plus 5 million others in camps like Auschwitz. Nuremberg Trials 1945-49 tried Goering and 21 leaders: 12 hanged, new crimes of genocide and crimes against humanity defined.', 'Holocaust and Nuremberg Trials', 'Aftermath - justice', 93),
  (_deck_id, _user_id, 'What came right after WWII: UN, Marshall Plan, Cold War?', 'United Nations founded 1945. Marshall Plan 1947 gave 13.3 billion dollars to rebuild Europe. Nuremberg set war-crimes law. U.S.-Soviet split over Germany and Eastern Europe began the Cold War.', 'Aftermath - new order', 94);
  UPDATE custom_decks SET card_count = 95, updated_at = now() WHERE id = _deck_id;

  -- ============================================================
  -- DECK 8: Cold War and Modern World (42 cards)
  -- ============================================================
  INSERT INTO custom_decks (user_id, title, description, card_count, course_id)
  VALUES (_user_id, 'Cold War and Modern World', 'Figures, treaties, crises and decolonization 1945-present', 42, _course_id)
  RETURNING id INTO _deck_id;

  INSERT INTO custom_deck_cards (deck_id, user_id, front, back, hint, sort_order) VALUES
  (_deck_id, _user_id, 'U.S. President 1945-1953. Authorized the atomic bombings. Announced the Truman Doctrine on Mar 12, 1947: support free peoples resisting subjugation. Created NATO and intervened in Korea.', 'Harry S. Truman (1884-1972)', 'Cold War - Truman', 0),
  (_deck_id, _user_id, 'Soviet Premier. Imposed communist regimes across Eastern Europe, creating the Eastern Bloc. Blockaded West Berlin in 1948-49. Died Mar 5, 1953.', 'Joseph Stalin (1878-1953) in the Cold War', 'Cold War - Stalin', 1),
  (_deck_id, _user_id, 'Soviet Premier 1953-1964. Denounced Stalin in the 1956 Secret Speech. Crushed Hungary 1956, built the Berlin Wall 1961, placed missiles in Cuba 1962 then withdrew them. Removed 1964.', 'Nikita Khrushchev (1894-1971)', 'Cold War - Khrushchev', 2),
  (_deck_id, _user_id, 'U.S. President 1961-1963. Authorized the Bay of Pigs 1961. Resolved the Cuban Missile Crisis Oct 1962. Signed the Test Ban Treaty 1963. Assassinated Nov 22, 1963 in Dallas.', 'John F. Kennedy (1917-1963)', 'Cold War - Kennedy', 3),
  (_deck_id, _user_id, 'U.S. President 1963-1969. Used the Gulf of Tonkin Resolution 1964 to escalate Vietnam to 500,000 troops. Tet Offensive 1968 destroyed public support; declined to run again.', 'Lyndon B. Johnson (1908-1973)', 'Cold War - Johnson', 4),
  (_deck_id, _user_id, 'U.S. President 1969-1974. Detente with Brezhnev, historic visit to China Feb 1972, withdrew from Vietnam by 1973. Resigned Aug 9, 1974 over Watergate.', 'Richard Nixon (1913-1994)', 'Cold War - Nixon', 5),
  (_deck_id, _user_id, 'Soviet leader 1985-1991. Glasnost (openness) and perestroika (restructuring) reforms plus arms deals with Reagan unintentionally triggered the collapse of the USSR in Dec 1991. Nobel Prize 1990.', 'Mikhail Gorbachev (1931-2022)', 'Cold War - Gorbachev', 6),
  (_deck_id, _user_id, 'U.S. President 1981-1989. Escalated the Cold War with the Strategic Defense Initiative, then negotiated the INF Treaty 1987. Tear down this wall speech in Berlin, Jun 1987.', 'Ronald Reagan (1911-2004)', 'Cold War - Reagan', 7),
  (_deck_id, _user_id, 'U.S. diplomat who wrote the Long Telegram 1946 and the X Article 1947, authoring the containment policy: stop the spread of communism everywhere it pressed.', 'George Kennan (1904-2005)', 'Cold War - containment author', 8),
  (_deck_id, _user_id, 'Soviet leader 1964-1982. Crushed the Prague Spring 1968, signed SALT I 1972, invaded Afghanistan 1979. Era of stagnation.', 'Leonid Brezhnev (1906-1982)', 'Cold War - Brezhnev', 9),
  (_deck_id, _user_id, 'U.S. President 1953-1961. Proposed the Domino Theory, ended the Korean War 1953, built NATO and the Interstate system, warned of the military-industrial complex in 1961.', 'Dwight D. Eisenhower (1890-1969) in the Cold War', 'Cold War - Eisenhower', 10),
  (_deck_id, _user_id, 'Founded by the Charter signed Jun 26, 1945 in San Francisco by 50 states. Security Council with 5 permanent veto powers. Peacekeeping, decolonization, and human rights missions worldwide.', 'United Nations (1945)', 'Org - UN', 11),
  (_deck_id, _user_id, 'U.S. pledged to support free peoples resisting subjugation. First applied with 400 million dollars to Greece and Turkey. Formal start of containment and the Cold War.', 'Truman Doctrine (Mar 12, 1947)', 'Doctrine - Truman', 12),
  (_deck_id, _user_id, 'U.S. gave 13.3 billion dollars to rebuild Western Europe under Secretary Marshall. Revived industry, blocked communism in France and Italy. USSR answered with COMECON.', 'Marshall Plan (1947-1951)', 'Aid - Marshall Plan', 13),
  (_deck_id, _user_id, 'North Atlantic Treaty Organization: Western military alliance of 12 founding states in Washington. Article 5: an attack on one is an attack on all. First peacetime U.S. alliance.', 'NATO (Apr 4, 1949)', 'Alliance - NATO', 14),
  (_deck_id, _user_id, 'Council for Mutual Economic Assistance: Soviet economic bloc answering the Marshall Plan. Linked USSR with Eastern Europe, Cuba, and Vietnam until 1991.', 'COMECON (1949)', 'Bloc - COMECON', 15),
  (_deck_id, _user_id, 'Eastern military alliance of the USSR and 7 satellites, formed after West Germany joined NATO. Invaded Hungary 1956 and Czechoslovakia 1968. Dissolved 1991.', 'Warsaw Pact (May 14, 1955)', 'Alliance - Warsaw Pact', 16),
  (_deck_id, _user_id, 'Southeast Asia Treaty Organization: Asian counterpart to NATO with the U.S., Britain, France, and regional states. Never as effective; dissolved 1977 after Vietnam.', 'SEATO (1954-1977)', 'Alliance - SEATO', 17),
  (_deck_id, _user_id, 'Banned nuclear tests in the atmosphere, space, and underwater after the Cuban crisis. Signed by the U.S., USSR, and Britain. Underground tests continued.', 'Nuclear Test Ban Treaty (Aug 5, 1963)', 'Arms control - Test Ban', 18),
  (_deck_id, _user_id, 'SALT I: Nixon and Brezhnev limited ABM systems and froze ICBM numbers. SALT II: Carter and Brezhnev set equal launchers, never ratified after the Afghan invasion.', 'SALT I (1972) and SALT II (1979)', 'Arms control - SALT', 19),
  (_deck_id, _user_id, 'INF: Reagan and Gorbachev eliminated all intermediate-range missiles, the first deal to destroy weapons. START I: Bush and Gorbachev cut strategic warheads by a third.', 'INF Treaty (1987) and START I (1991)', 'Arms control - INF and START', 20),
  (_deck_id, _user_id, 'Stalin cut all land access to West Berlin. The Allies flew 2.3 million tons of food and coal in 278,228 flights. Blockade failed; NATO formed months later.', 'Berlin Blockade and Airlift (Jun 1948 - May 1949)', 'Crisis - Berlin', 21),
  (_deck_id, _user_id, 'North Korea invaded the South Jun 25, 1950. UN forces under MacArthur landed at Inchon, China intervened, stalemate at the 38th parallel. About 2.5 million dead. Armistice Jul 27, 1953, no peace treaty.', 'Korean War (1950-1953)', 'War - Korea', 22),
  (_deck_id, _user_id, 'CIA-backed landing of 1,400 Cuban exiles to topple Fidel Castro (in power since Jan 1959). No air cover from Kennedy, invaders crushed in 3 days. Pushed Cuba toward the USSR.', 'Bay of Pigs (Apr 17-19, 1961)', 'Crisis - Bay of Pigs', 23),
  (_deck_id, _user_id, 'U.S. spy planes found 42 Soviet R-12 nuclear missiles in Cuba. Kennedy blockaded the island for 13 days. Khrushchev withdrew missiles; U.S. secretly removed Jupiters from Turkey. Closest the world came to nuclear war.', 'Cuban Missile Crisis (Oct 16-28, 1962)', 'Crisis - 1962', 24),
  (_deck_id, _user_id, 'U.S. backed South Vietnam against Ho Chi Minh North. Gulf of Tonkin 1964, Rolling Thunder bombing 1965-68, Tet Offensive Jan 1968, withdrawal 1973, Saigon fell Apr 30, 1975. About 58,000 Americans and 2 million Vietnamese dead.', 'Vietnam War (1955-1975)', 'War - Vietnam', 25),
  (_deck_id, _user_id, 'When did the Berlin Wall fall and the USSR dissolve?', 'Berlin Wall opened Nov 9, 1989 after East German reforms. Germany reunited Oct 1990. USSR dissolved Dec 26, 1991 into 15 states. Cold War ended.', 'End - 1989 and 1991', 26),
  (_deck_id, _user_id, 'MAD (Mutual Assured Destruction): both sides can annihilate each other, so neither strikes first. Containment (Kennan 1947): stop the spread of communism everywhere without direct war.', 'MAD and Containment', 'Strategy - MAD and containment', 27),
  (_deck_id, _user_id, 'Domino Theory (Eisenhower 1954): if one country falls to communism, neighbors follow; justified Vietnam. Salami Tactics: communists took Eastern Europe slice by slice through rigged coalitions.', 'Domino Theory and Salami Tactics', 'Strategy - domino and salami', 28),
  (_deck_id, _user_id, 'Superpowers armed opposing sides instead of fighting directly: Korea 1950-53, Vietnam 1955-75, Afghanistan 1979-89, Angola, Nicaragua, and others across Asia, Africa, and Latin America.', 'Cold War proxy wars', 'Strategy - proxy wars', 29),
  (_deck_id, _user_id, 'Multiple Independently targetable Reentry Vehicles: one missile carrying several warheads to different targets. Deployed by the U.S. from 1970 and USSR from 1975, multiplying arsenals.', 'MIRVs', 'Tech - MIRV', 30),
  (_deck_id, _user_id, 'Little Boy: uranium gun-type bomb, 15 kilotons, Hiroshima Aug 6, 1945. Fat Man: plutonium implosion bomb, 21 kilotons, Nagasaki Aug 9, 1945. Only combat nuclear uses.', 'Little Boy and Fat Man (1945)', 'Weapons - fission bombs', 31),
  (_deck_id, _user_id, 'Tsar Bomba (Oct 30, 1961): Soviet 50-megaton blast, largest explosion ever. SS-18 Satan (1975): Soviet ICBM carrying 10 warheads of 550 kilotons over 11,000 km. Peak of the arms race.', 'Tsar Bomba and SS-18 Satan', 'Weapons - H-bomb and ICBM', 32),
  (_deck_id, _user_id, '1947: India and Pakistan independent under Nehru, Gandhi assassinated 1948. 1960: 17 African nations freed, the Year of Africa. 1955: Bandung Conference of Asian-African states, Third World and Non-Aligned Movement 1961 under Tito, Nehru, and Nasser.', 'decolonization', 'Decolonization', 33),
  (_deck_id, _user_id, 'Algerian War 1954-62: France vs FLN, 1 million dead, independence 1962. Congo Crisis 1960-65: Lumumba murdered, UN intervention. Biafran War 1967-70: Nigerian civil war with mass famine.', 'Algerian War, Congo Crisis, and Biafran War', 'Decolonization - conflicts', 34),
  (_deck_id, _user_id, 'Designer Mikhail Kalashnikov, adopted 1947, USSR Izhevsk. Gas-operated selective fire, 7.62x39mm, 30-round curved magazine, 600 rpm, 300m effective, 4.3 kg. Over 100 million produced: most widely used assault rifle ever, from Vietnam to Afghanistan.', 'AK-47', 'Weapon - AK-47', 35),
  (_deck_id, _user_id, 'Designer Eugene Stoner, adopted 1964, USA (Armalite/Colt). Direct-impingement gas, 5.56 NATO, 20/30-round magazine, 700-900 rpm, 550m effective, 3.4 kg. U.S. standard rifle from Vietnam onward.', 'M-16', 'Weapon - M-16', 36),
  (_deck_id, _user_id, 'What changed air travel: Comet, 707, 747, Concorde?', 'Comet 1949 (Britain): first jet airliner. Boeing 707 (1958): first mass jetliner, 150 passengers at 550 mph. 747 Jumbo by Joe Sutter (1969): 400 plus passengers. Concorde (1976-2003): supersonic London-New York in 3 hours.', 'Transport - air', 37),
  (_deck_id, _user_id, 'What changed land and sea transport after 1945?', 'Shinkansen bullet train by Hideo Shima (Tokyo-Osaka 1964): 210 km per hour, now 320. TGV France 1981. Container shipping by Malcolm McLean (Ideal X 1956): standard 20/40-ft boxes cut shipping cost about 90 percent. U.S. Interstate Highway System from 1956.', 'Transport - land and sea', 38),
  (_deck_id, _user_id, 'Sputnik 1 by Korolev (Oct 4, 1957): first satellite. Yuri Gagarin (Apr 12, 1961): first human orbit. Apollo 11 (Jul 20, 1969): Armstrong and Aldrin walked on the Moon. ISS from 1998: continuous habitation since 2000. Falcon reusable boosters (2015): SpaceX.', 'space milestones', 'Space race', 39),
  (_deck_id, _user_id, 'ARPANET 1969 (U.S. DARPA): first packet network. World Wide Web by Tim Berners-Lee 1990 at CERN. GPS operational 1995 for the military, opened to civilians 2000.', 'ARPANET, the Web, and GPS', 'Tech - internet', 40),
  (_deck_id, _user_id, 'What ideologies and philosophies shaped the modern world?', 'Capitalism vs communism blocs. Decolonization nationalism (Gandhi, Nkrumah). Non-Alignment 1961 (Tito, Nehru, Nasser). Neoliberalism (Hayek, Friedman, Reagan, Thatcher). Environmentalism (Carson Silent Spring 1962). Feminism second wave (Beauvoir 1949). Human rights (UDHR 1948, Geneva 1949, ICC 2002). Globalization (WTO 1995, EU Maastricht 1993).', 'Ideology - modern', 41);
  UPDATE custom_decks SET card_count = 42, updated_at = now() WHERE id = _deck_id;

  RAISE NOTICE 'Import complete for user % in category GILAS', _user_id;
END $$;
