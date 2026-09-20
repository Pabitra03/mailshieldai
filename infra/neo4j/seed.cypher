// MailShieldAI — Neo4j seed: constraints and indexes for the campaign graph
//
// Node types:
//   (:Email {case_id, subject, sender, recipient, risk_score, verdict, timestamp})
//   (:Sender {address, display_name})
//   (:Domain {name})
//   (:IP {address, asn, org, country, is_tor, is_vpn})
//   (:Campaign {id, name, first_seen, last_seen, email_count})
//
// Relationship types:
//   (Email)-[:SENT_BY]->(Sender)
//   (Sender)-[:USES_DOMAIN]->(Domain)
//   (Email)-[:ORIGINATED_FROM]->(IP)
//   (Email)-[:PART_OF]->(Campaign)
//   (Sender)-[:LINKED_TO]->(Sender)  // shared infrastructure
//   (IP)-[:BELONGS_TO_ASN]->(Domain)

// Uniqueness constraints
CREATE CONSTRAINT email_case_id IF NOT EXISTS FOR (e:Email) REQUIRE e.case_id IS UNIQUE;
CREATE CONSTRAINT sender_address IF NOT EXISTS FOR (s:Sender) REQUIRE s.address IS UNIQUE;
CREATE CONSTRAINT domain_name IF NOT EXISTS FOR (d:Domain) REQUIRE d.name IS UNIQUE;
CREATE CONSTRAINT ip_address IF NOT EXISTS FOR (i:IP) REQUIRE i.address IS UNIQUE;
CREATE CONSTRAINT campaign_id IF NOT EXISTS FOR (c:Campaign) REQUIRE c.id IS UNIQUE;

// Indexes for fast lookup
CREATE INDEX email_verdict IF NOT EXISTS FOR (e:Email) ON (e.verdict);
CREATE INDEX email_risk IF NOT EXISTS FOR (e:Email) ON (e.risk_score);
CREATE INDEX ip_asn IF NOT EXISTS FOR (i:IP) ON (i.asn);
