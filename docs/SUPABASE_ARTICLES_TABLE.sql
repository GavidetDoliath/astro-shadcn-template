-- Create articles table for La Déraison
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lettre', 'pamphlet', 'fosse')),
  image TEXT,
  slug TEXT UNIQUE NOT NULL,
  author TEXT DEFAULT 'La Rédaction',
  linkedinUrl TEXT,
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_articles_date ON articles(date DESC);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published ON articles(published);

-- Create trigger for automatic updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert sample articles (from articles.json)
INSERT INTO articles (id, title, excerpt, date, category, image, slug, author, linkedinUrl, published, featured) VALUES
('20772775-49d0-479c-ae03-5f946c8d0ef0', 'La Malédiction Mélenchon', 'Il existe, dans la nosologie des maladies orphelines, une pathologie si rare que l''Organisation mondiale de la Santé n''a jamais osé lui consacrer une entrée : le syndrome de Midas inversé, affection par laquelle tout ce que ', '2026-03-01', 'lettre', '/assets/articles/placeholder.jpg', 'la-malediction-melenchon', 'François Vannesson', 'https://fr.linkedin.com/pulse/la-mal%C3%A9diction-m%C3%A9lenchon-fran%C3%A7ois-vannesson-vcube', true, true),
('2b262899-c718-4251-b0f0-9d042d9f6f50', 'Crève, c''est remboursé', 'La France, ce pays qui n''a plus les moyens de payer la morphine mais trouve encore le budget pour financer la seringue létale, examine donc en ce mois de février 2026, avec la solennité d''un croque-mort qui aurait sniffé', '2026-02-18', 'lettre', '/assets/articles/placeholder.jpg', 'creve-c-est-rembourse', 'François Vannesson', 'https://fr.linkedin.com/pulse/cr%C3%A8ve-cest-rembours%C3%A9-fran%C3%A7ois-vannesson-hpj9e', true, false),
('e45a06a0-8f71-449e-8e60-910ce0fb724c', 'Circulaire A.F.F.L.E.U.R. n°2026‑VDL–14F/69', 'DOCUMENT OFFICIEL - RÉPUBLIQUE FRANÇAISE Ministère de la Coordination Intime et de la Synergie Copulatoire (MCISC) Direction Générale de l''Optimisation Érogène Stratégique (DGOES) Note stratégique confidentielle - Circul', '2026-02-14', 'pamphlet', '/assets/articles/placeholder.jpg', 'circulaire-a-f-f-l-e-u-r-n-2026-vdl-14f-69', 'François Vannesson', 'https://fr.linkedin.com/pulse/circulaire-affleur-n2026vdl14f69-fran%C3%A7ois-vannesson-lb2ye', true, false),
('9fd2537a-3fed-4031-b41e-bc5a50e7f788', 'Sur un malentendu, ça peut marcher!', 'LinkedIn respecte votre confidentialité. LinkedIn et des tiers utilisent des cookies essentiels et non essentiels pour fournir, sécuriser, analyser et améliorer nos Services, et pour', '2026-02-12', 'lettre', '/assets/articles/placeholder.jpg', 'sur-un-malentendu-ca-peut-marcher', 'François Vannesson', 'https://fr.linkedin.com/pulse/sur-un-malentendu-%C3%A7a-peut-marcher-fran%C3%A7ois-vannesson-kltse', true, false),
('c835fbeb-432f-451c-9ff9-81a15c3d27a6', 'Vous confondez cohérence et soumission : nous, non', 'Ils sont là. Alignés comme des cierges trempés dans la vaseline, veillant pieusement sur la pureté morale du monde médiatique, à condition que cette pureté suinte l''eau tiède, le tofu tiède, l''indignation tiède.', '2026-02-09', 'lettre', '/assets/articles/placeholder.jpg', 'vous-confondez-coherence-et-soumission-nous-non', 'François Vannesson', 'https://fr.linkedin.com/pulse/vous-confondez-coh%C3%A9rence-et-soumission-nous-non-fran%C3%A7ois-vannesson-g8ooe', true, false),
('85fb6f3d-0641-46a4-b7cb-114807332ce6', 'La Fosse des Littérateurs', 'Descendre dans les profondeurs de ce qui reste de la littérature française. Un récit de décomposition.', '2026-02-05', 'fosse', '/assets/articles/placeholder.jpg', 'la-fosse-des-litterateurs', 'La Rédaction', 'https://fr.linkedin.com/pulse/fosse-litt%C3%A9rateurs-fran%C3%A7ois-vannesson-abc123', true, true);
