-- =========================================================
--  APOS'CREED — Seed Data
--  Run AFTER schema.sql
-- =========================================================
USE `aposcreed_db`;

-- ---------------------------------------------------------
-- Settings
-- ---------------------------------------------------------
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('site_name',        'Apos\'Creed'),
('site_tagline',     'Your Ultimate Gaming Universe'),
('site_email',       'contact@aposcreed.mg'),
('site_phone',       '+261 34 00 000 00'),
('currency',         'MGA'),
('currency_symbol',  'Ar'),
('currency_rate',    '1'),
('shipping_cost',    '5000'),
('free_shipping_threshold', '100000'),
('maintenance_mode', '0'),
('logo_url',         '/assets/logo.svg'),
('facebook_url',     'https://facebook.com/aposcreed'),
('instagram_url',    'https://instagram.com/aposcreed'),
('twitter_url',      'https://twitter.com/aposcreed'),
('meta_description', 'Shop video games, accessories, and gift cards at Apos\'Creed — Madagascar\'s premier gaming store.');

-- ---------------------------------------------------------
-- Admin User  (password = Admin@1234)
-- ---------------------------------------------------------
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `email_verified`) VALUES
('Admin', 'admin@aposcreed.mg',
 '$2y$12$YuL6DMN8cRJ0jzpCHLRFYeqWp5WcNGm0yrFjDvYxMHRcbCnGxk6mO',
 'admin', 1);

-- ---------------------------------------------------------
-- Categories
-- ---------------------------------------------------------
INSERT INTO `categories` (`name`, `slug`, `description`, `image`, `sort_order`) VALUES
('PC Games',         'pc-games',         'Download & physical PC games',                   '/assets/cat_pc.webp',           1),
('PlayStation',      'playstation',       'PS4 & PS5 games and accessories',                '/assets/cat_ps.webp',           2),
('Xbox',             'xbox',             'Xbox Series X/S & One games',                    '/assets/cat_xbox.webp',         3),
('Nintendo Switch',  'nintendo-switch',  'Switch games and accessories',                   '/assets/cat_switch.webp',       4),
('Accessories',      'accessories',      'Controllers, headsets, keyboards and more',      '/assets/cat_accessories.webp',  5),
('Gift Cards',       'gift-cards',       'PSN, Xbox, Steam and mobile gift cards',         '/assets/cat_giftcards.webp',    6);

-- ---------------------------------------------------------
-- Products  (12 sample products)
-- ---------------------------------------------------------
INSERT INTO `products`
  (`category_id`,`name`,`slug`,`short_description`,`description`,
   `price`,`discount_percent`,`platform`,`is_digital`,`stock`,
   `sku`,`cover_image`,`release_date`,`publisher`,`developer`,
   `age_rating`,`is_featured`,`is_active`)
VALUES
-- PC Games
(1,'Cyberpunk 2077','cyberpunk-2077',
 'Open-world RPG set in a dystopian megacity.',
 '<p>Experience V''s epic journey through Night City, a megalopolis obsessed with power, glamour and body modification. You and your friends get to be outlaws and heroes on the edge of a world where anything goes.</p><p>Includes: Base game + Phantom Liberty DLC</p>',
 89900, 30, 'PC', 1, 999,
 'PC-CP2077','covers/cyberpunk2077.webp','2020-12-10','CD Projekt Red','CD Projekt Red','M',1,1),

(1,'Elden Ring','elden-ring',
 'An epic dark fantasy action RPG from FromSoftware.',
 '<p>Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between. A vast world to explore on foot or horseback.</p>',
 79900, 15, 'PC', 1, 500,
 'PC-ER2022','covers/eldenring.webp','2022-02-25','Bandai Namco','FromSoftware','M',1,1),

(1,'Hogwarts Legacy','hogwarts-legacy',
 'Explore an open-world 19th century Hogwarts.',
 '<p>Hogwarts Legacy is an immersive, open-world action RPG set in the world first introduced in the Harry Potter books. Now you can take control of the action and be at the centre of your own adventure in the wizarding world.</p>',
 69900, 20, 'PC', 1, 300,
 'PC-HL2023','covers/hogwartslegacy.webp','2023-02-10','Warner Bros.','Avalanche Software','T',0,1),

-- PlayStation
(2,'Spider-Man 2','spider-man-2',
 'Marvel''s Spider-Man 2 — Two heroes, one city.',
 '<p>Swing through New York as both Peter Parker and Miles Morales in this PlayStation 5 exclusive. Face the symbiote threat alongside a roster of iconic Marvel villains.</p>',
 99900, 10, 'PlayStation', 0, 150,
 'PS5-SM2','covers/spiderman2.webp','2023-10-20','Sony Interactive','Insomniac Games','T',1,1),

(2,'God of War Ragnarök','god-of-war-ragnarok',
 'The sequel to the critically acclaimed God of War.',
 '<p>Embark on a mythic journey for answers before Ragnarök arrives. Kratos and Atreus must journey to each of the Nine Realms in search of answers as Asgardian forces prepare for the prophesied battle.</p>',
 94900, 0, 'PlayStation', 0, 200,
 'PS5-GOWR','covers/gowr.webp','2022-11-09','Sony Interactive','Santa Monica Studio','M',1,1),

(2,'Final Fantasy XVI','final-fantasy-xvi',
 'A dark and gritty chapter in the legendary JRPG series.',
 '<p>Experience an all-new standalone tale unfolding in Valisthea, a dark fantasy world where Dominants control monstrous Eikons and nations crumble. A mature, story-driven action RPG.</p>',
 84900, 25, 'PlayStation', 0, 120,
 'PS5-FF16','covers/ff16.webp','2023-06-22','Square Enix','Square Enix','M',0,1),

-- Xbox
(3,'Forza Horizon 5','forza-horizon-5',
 'The ultimate open-world racing on Xbox.',
 '<p>Lead breathtaking expeditions across the vibrant open world landscapes of Mexico with limitless, fun driving action in hundreds of the world''s greatest cars. PC/Xbox Play Anywhere title.</p>',
 59900, 35, 'Xbox,PC', 1, 999,
 'XBX-FH5','covers/forzah5.webp','2021-11-09','Xbox Game Studios','Playground Games','E',1,1),

(3,'Halo Infinite','halo-infinite',
 'Master Chief returns in an epic open-world adventure.',
 '<p>The legendary Halo series returns with the most ambitious Master Chief story yet. Explore the open-world ringworld Zeta Halo and battle the Banished across sprawling environments.</p>',
 54900, 40, 'Xbox,PC', 1, 999,
 'XBX-HI','covers/haloinfinite.webp','2021-12-08','Xbox Game Studios','343 Industries','T',0,1),

-- Accessories
(5,'SteelSeries Arctis Nova Pro','steelseries-arctis-nova-pro',
 'Premium wireless gaming headset with active noise cancellation.',
 '<p>The Arctis Nova Pro Wireless features Hot-Swap dual batteries, multi-system connect to use with up to 2 sources simultaneously, and Hi-Res Audio drivers for studio-quality sound.</p>',
 299000, 0, 'All', 0, 50,
 'ACC-SANP','covers/arctis_nova.webp','2022-09-29','SteelSeries','SteelSeries','All',0,1),

(5,'DualSense Wireless Controller','dualsense-controller',
 'Discover a deeper connection with PS5 games.',
 '<p>The DualSense wireless controller features haptic feedback and dynamic adaptive triggers for an immersive gaming experience. USB-C charging, built-in microphone, and up to 12-hour battery life.</p>',
 149000, 0, 'PlayStation', 0, 80,
 'ACC-DS5','covers/dualsense.webp','2020-11-12','Sony Interactive','Sony Interactive','All',0,1),

-- Gift Cards
(6,'PSN Gift Card 50,000 Ar','psn-gift-card-50000',
 'Top up your PlayStation wallet instantly.',
 '<p>Valid for PlayStation Network purchases including games, DLC, subscriptions, and add-ons. Code delivered digitally to your email after payment confirmation. Madagascar PSN store.</p>',
 50000, 0, 'PlayStation', 1, 9999,
 'GC-PSN-50K','covers/psn_card.webp','2024-01-01','Sony Interactive','Sony Interactive','All',0,1),

(6,'Steam Wallet Card 100,000 Ar','steam-wallet-100000',
 'Fund your Steam account and buy any game.',
 '<p>The Steam Wallet code can be used to purchase games, DLC, and other items available on Steam. Simply log in to Steam, select Add Funds to your Steam Wallet, and enter the code.</p>',
 100000, 5, 'PC', 1, 9999,
 'GC-STM-100K','covers/steam_card.webp','2024-01-01','Valve','Valve','All',1,1);

-- ---------------------------------------------------------
-- Sample Reviews
-- ---------------------------------------------------------
-- (requires user IDs — will reference admin = 1)
INSERT INTO `reviews` (`product_id`,`user_id`,`rating`,`title`,`body`,`is_verified`,`is_approved`) VALUES
(1, 1, 5, 'Incredible open world', 'Night City is breathtaking. The story is memorable and gameplay is addictive after the 2.0 patch.', 1, 1),
(2, 1, 5, 'Best Soulslike ever made', 'Elden Ring set a new standard. Exploration is rewarding and boss fights are legendary.', 1, 1),
(4, 1, 5, 'Mind-blowing PS5 exclusive', 'Spider-Man 2 is a technical marvel. The symbiote mechanics add a thrilling twist.', 1, 1);
