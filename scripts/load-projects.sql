-- ============================================================
-- THM Project Load Script — 162 projects
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Delete junk/test projects
DELETE FROM projects WHERE name ILIKE '%test%' OR name ILIKE 'gay%' OR name ILIKE 'qecec%' OR name ILIKE 'evrever%' OR name = 'Ontraccr Project placeholder';

-- 2. Insert all 162 projects (skip if name already exists)
-- Using a function to avoid duplicates
DO $$
DECLARE
  v_id uuid;
BEGIN

-- ============ ACTIVE (67) ============

INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Burton Creek Heat Mitigation', 'TC Energy', 'E.028418', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Burton Creek Heat Mitigation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Dusty Lake Video Surveillance Implementation', 'TC Energy', 'E.036673', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Dusty Lake Video Surveillance Implementation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Burton Creek Cold Recycle Valve', 'TC Energy', 'E.028418', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Burton Creek Cold Recycle Valve');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT '2026 ECAP - Clear Water', 'TC Energy', 'E.032277', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '2026 ECAP - Clear Water');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Materials 2026 Alces River Stn. & Unit B2 PLC Obsolescence', 'TC Energy', 'E.036793', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Materials 2026 Alces River Stn. & Unit B2 PLC Obsolescence');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Swartz Creek Seal Gas Booster Pump Installation', 'TC Energy', 'E.037033', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Swartz Creek Seal Gas Booster Pump Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Non Billable Time', 'TC Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Non Billable Time');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Winchell Lake Heater Piping Upgrade', 'TC Energy', 'PO4500', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Winchell Lake Heater Piping Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Denning Lake Grounding Cables Replacement', 'TC Energy', 'WO 45464664', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Denning Lake Grounding Cables Replacement');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT '2026 NGTL LDAR Capital Project Wainwright', 'TC Energy', 'E.040770', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '2026 NGTL LDAR Capital Project Wainwright');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Behan MCC Repair', 'TC Energy', 'E.040321.1.06', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Behan MCC Repair');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'IronBird Contracting Option Excavating Saddle Hills HDD Vault Tie-In Spools', 'IronBird Contracting', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'IronBird Contracting Option Excavating Saddle Hills HDD Vault Tie-In Spools');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT '2026 ECAP - Gadsby', 'TC Energy', 'E.032277', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '2026 ECAP - Gadsby');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Crowsnest Pass - ECAP', 'TC Energy', 'E.040255', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Crowsnest Pass - ECAP');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Acme - ECAP Actuator Saddle Bracket Installation', 'TC Energy', 'E.027619', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Acme - ECAP Actuator Saddle Bracket Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Nordegg B5 Booster Installation', 'TC Energy', 'E.037033', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Nordegg B5 Booster Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Medicine Hat - LDAR Scrubber Scope', 'TC Energy', 'E.040770', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Medicine Hat - LDAR Scrubber Scope');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Unassigned / No Project', 'TC Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Unassigned / No Project');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT '2026 Silencer Inspection Support', 'TC Energy', 'E.040321.1.13', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '2026 Silencer Inspection Support');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Non-Billable Quality Team', 'TC Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Non-Billable Quality Team');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Fox Creek - Inline TVP', 'TC Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Fox Creek - Inline TVP');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Beiseker B3 Booster Installation', 'TC Energy', 'E.037033', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Beiseker B3 Booster Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Meikle River D5 Booster Installation', 'TC Energy', 'E.037033', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Meikle River D5 Booster Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Saddle Hills B3 Booster Installation', 'TC Energy', 'E.037033', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Saddle Hills B3 Booster Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Saturn A1 Booster Installation', 'TC Energy', 'E.037033', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Saturn A1 Booster Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Wainwright - ECAP Bracket Installation', 'TC Energy', 'E.027618', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Wainwright - ECAP Bracket Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Nordegg Platform Install', 'TC Energy', 'E.037126', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Nordegg Platform Install');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Wolf Lake A3 Booster Installation', 'TC Energy', 'E.037033', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Wolf Lake A3 Booster Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Ironbird Saddle Hills Pigging Chamber Flange Weld', 'IronBird Contracting', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Ironbird Saddle Hills Pigging Chamber Flange Weld');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Secure - Fox Creek - LACT End Device Checks', 'Secure Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Secure - Fox Creek - LACT End Device Checks');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Bi-Annual PSV PMs', 'TC Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Bi-Annual PSV PMs');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Woodenhouse CS Video Surveillance - SITE VISIT', 'TC Energy', 'C.002323', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Woodenhouse CS Video Surveillance - SITE VISIT');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Clearwater A6 Fan Upgrade', 'TC Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Clearwater A6 Fan Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Vetchland - ECAP Bracket Installation', 'TC Energy', 'E.027618', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Vetchland - ECAP Bracket Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Saturn - A1 Fuel Gas Regulator Upgrade', 'TC Energy', 'E.030255', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Saturn - A1 Fuel Gas Regulator Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT '2026 ECAP - Field Lake', 'TC Energy', 'E.032277', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '2026 ECAP - Field Lake');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT '2026 ECAP - Paul Lake', 'TC Energy', 'E.032277', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '2026 ECAP - Paul Lake');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'ECAP - Cost Estimate for Constructability Review and Site Visits', 'TC Energy', 'E.032277', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'ECAP - Cost Estimate for Constructability Review and Site Visits');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Turner Valley - ECAP CS NPS 12 Blowdown Valve Replacement', 'TC Energy', 'E.032277', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Turner Valley - ECAP CS NPS 12 Blowdown Valve Replacement');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Schrader Creek A1 Hot Recycle', 'TC Energy', 'E.033528', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Schrader Creek A1 Hot Recycle');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Knight - Instrument Air Upgrade', 'TC Energy', 'E.036702', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Knight - Instrument Air Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Turner Valley - A2 Exhaust Replacement', 'TC Energy', 'E.036941', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Turner Valley - A2 Exhaust Replacement');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Leismer East FG Isolation Upgrade', 'TC Energy', 'E.037094', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Leismer East FG Isolation Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Hussar PFCC OSMB Upgrade', 'TC Energy', 'E.037109', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Hussar PFCC OSMB Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Berland Station Recycle Valve', 'TC Energy', 'E.037844.3.01', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Berland Station Recycle Valve');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Drywood - CS Air Comp Upgrade', 'TC Energy', 'E.037904', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Drywood - CS Air Comp Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Berland B2 Start Gas Level Switch', 'TC Energy', 'E.040321.1.07', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Berland B2 Start Gas Level Switch');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Berland River - LDAR Capital Project - SITE VISIT', 'TC Energy', 'E.040770', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Berland River - LDAR Capital Project - SITE VISIT');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Schrader - LDAR Vent Valve', 'TC Energy', 'E.040770', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Schrader - LDAR Vent Valve');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT '2026 NGTL Hussar A6/7/8 FG Meter and Flow Computer Upgrades - Site Visit', 'TC Energy', 'E.041427', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '2026 NGTL Hussar A6/7/8 FG Meter and Flow Computer Upgrades - Site Visit');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Moyie CS Fire Eye - SITE VISIT', 'TC Energy', 'E.041562', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Moyie CS Fire Eye - SITE VISIT');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Old Castle - Frame Repair', 'Old Castle', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Old Castle - Frame Repair');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Old Castle - Kiln Project', 'Old Castle', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Old Castle - Kiln Project');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Oldcastle Kiln Addition', 'Old Castle', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Oldcastle Kiln Addition');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Turnqe - Frac 2/3 Turnaround', 'Turnqe', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Turnqe - Frac 2/3 Turnaround');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Alces River - CS Station & Unit B2 Obs Project', 'TC Energy', 'E.036793', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Alces River - CS Station & Unit B2 Obs Project');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Alces River - PLC Obsolescence Constructability', 'TC Energy', 'E.036793', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Alces River - PLC Obsolescence Constructability');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Behan DC Cable Theft Repair', 'TC Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Behan DC Cable Theft Repair');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Turner Valley Blowdown Vent Cap Install', 'TC Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Turner Valley Blowdown Vent Cap Install');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Wolf Lake CS Unit A3 Fuel SAVC Upgrade', 'TC Energy', 'E.035534', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Wolf Lake CS Unit A3 Fuel SAVC Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Alces River - PLC Upgrade', 'TC Energy', 'E.036696', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Alces River - PLC Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Knight Stn Failed Cables Replacement', 'TC Energy', 'E.040321.1.09', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Knight Stn Failed Cables Replacement');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Behan CS Station Addition of High Resistance Ground System', 'TC Energy', 'E.040806', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Behan CS Station Addition of High Resistance Ground System');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Alces River - Barton Flow Computer', 'TC Energy', 'E.037087', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Alces River - Barton Flow Computer');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Gold Creek CS Unit B3 Starter Shut-off Valve & Piping Mods', 'TC Energy', 'E.038540', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Gold Creek CS Unit B3 Starter Shut-off Valve & Piping Mods');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Beiseker - Cold Recycle Valve Replacement and Fire Protection', 'TC Energy', 'E.036791', 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Beiseker - Cold Recycle Valve Replacement and Fire Protection');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Turner Valley Fan Upgrades', 'TC Energy', NULL, 'Active' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Turner Valley Fan Upgrades');

-- ============ COMPLETE (3) ============

INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'ECAP Bracket Installation - Farrell Lake', 'TC Energy', 'E.027618', 'Complete' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'ECAP Bracket Installation - Farrell Lake');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Berland A1 GG Crane Ladder', 'TC Energy', 'E.041214.1.10', 'Complete' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Berland A1 GG Crane Ladder');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT '2026 Leismer East ACHE Fan Upgrade', 'TC Energy', 'E.040714', 'Complete' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '2026 Leismer East ACHE Fan Upgrade');

-- ============ ON HOLD (1) ============

INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Red Deer River - CS Air Comp Upgrade Stage 1 (Transformer Upgrade)', 'TC Energy', NULL, 'On Hold' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Red Deer River - CS Air Comp Upgrade Stage 1 (Transformer Upgrade)');

-- ============ ESTIMATING (formerly Planned) (30) ============

INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Clearwater - PM Fan Upgrade C7', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Clearwater - PM Fan Upgrade C7');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Berland River - Drywell Orifice Repair', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Berland River - Drywell Orifice Repair');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Berland River - B3 Starter Vent Level Switch', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Berland River - B3 Starter Vent Level Switch');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Winchell Lake - Lube Oil Cooler Install', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Winchell Lake - Lube Oil Cooler Install');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Groundbirch - Fuel Gas Upgrade', 'TC Energy', 'E.034996', 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Groundbirch - Fuel Gas Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Oakland - LDAR Scrubber', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Oakland - LDAR Scrubber');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Latornell - Fuel Gas Regulator Replacement', 'TC Energy', 'E.040263', 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Latornell - Fuel Gas Regulator Replacement');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Latornell - Barton Flow Computer', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Latornell - Barton Flow Computer');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Bigoray RMS Cleaning', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Bigoray RMS Cleaning');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Red Deer River - CS Air Comp Upgrade', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Red Deer River - CS Air Comp Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Crowsnest - LDAR Scrubber', 'TC Energy', 'E.040736', 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Crowsnest - LDAR Scrubber');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Crowsnest - B Barton 1130 Flow Computer', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Crowsnest - B Barton 1130 Flow Computer');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Crowsnest - A Barton 1130 Flow Computer', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Crowsnest - A Barton 1130 Flow Computer');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Torrington - UPS Upgrade', 'TC Energy', 'E.036703', 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Torrington - UPS Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Wilde Lake - PM Fan Upgrade', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Wilde Lake - PM Fan Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Elko - LDAR Scrubber', 'TC Energy', 'E.040736', 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Elko - LDAR Scrubber');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Elko - VIGV', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Elko - VIGV');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Good Fish - CS Security Installation', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Good Fish - CS Security Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Hidden Lake Security Installation', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Hidden Lake Security Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Woodenhouse - Air Comp Upgrade', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Woodenhouse - Air Comp Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Woodenhouse - Barton Flow Computer', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Woodenhouse - Barton Flow Computer');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Beiseker - VIGV', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Beiseker - VIGV');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Goldcreek - B3 Starter Shutoff', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Goldcreek - B3 Starter Shutoff');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Woodenhouse - Security Installation', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Woodenhouse - Security Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Jenner - Fuel and Utility Heat Ex Gas Detector', 'TC Energy', 'E.038588', 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Jenner - Fuel and Utility Heat Ex Gas Detector');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Woodenhouse - PM Fan Upgrade', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Woodenhouse - PM Fan Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Groundbirch - Security Installation', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Groundbirch - Security Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Hussar - Barton 1130 Flow Computer and PD Meter', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Hussar - Barton 1130 Flow Computer and PD Meter');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Nordegg C6 Booster Installation', 'TC Energy', 'E.037033', 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Nordegg C6 Booster Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Clearwater C7 Fan Upgrade', 'TC Energy', NULL, 'Estimating' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Clearwater C7 Fan Upgrade');

-- ============ ARCHIVED (61) ============

-- Former Active (10)
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Swartz Creek - PSV', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Swartz Creek - PSV');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'SLO Sample Point Tubing', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'SLO Sample Point Tubing');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT '2025 NGTL LDAR Expense Project', 'TC Energy', 'E.037506', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '2025 NGTL LDAR Expense Project');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Hanmore Lake C4 Fuel Gas Upgrade', 'TC Energy', 'E.035235', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Hanmore Lake C4 Fuel Gas Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'ELKO C PLC Upgrade', 'TC Energy', 'E.036453', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'ELKO C PLC Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Clearwater/Turner/Winchell Seal Gas Booster Phase 2', 'TC Energy', 'E.028486', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Clearwater/Turner/Winchell Seal Gas Booster Phase 2');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Siemens Energy - Saddle Hills C4 Outage', 'Siemens Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Siemens Energy - Saddle Hills C4 Outage');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Swartz Creek - Research Project', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Swartz Creek - Research Project');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'ABSA Cost Tracking', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'ABSA Cost Tracking');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Wild Lake Level Switch Upgrade', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Wild Lake Level Switch Upgrade');

-- Legacy Dashboard (35)
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Clearwater A6 Seal Gas Booster', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Clearwater A6 Seal Gas Booster');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Clearwater Seal Gas Booster Phase 2', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Clearwater Seal Gas Booster Phase 2');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Beiseker HVAC Platform Install', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Beiseker HVAC Platform Install');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Body Bleed Vents', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Body Bleed Vents');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Buffalo Creek ECAP', 'TC Energy', 'E.032277', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Buffalo Creek ECAP');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Burton Creek CS Video Surveillance', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Burton Creek CS Video Surveillance');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Contact Chemicals Maintenance Work', 'Contact Chemicals', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Contact Chemicals Maintenance Work');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Crowsnest Pass Servo Installation', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Crowsnest Pass Servo Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Cyclone Load Sheets', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Cyclone Load Sheets');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'ECAP Load Sheets', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'ECAP Load Sheets');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Metal Scan Load Sheets', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Metal Scan Load Sheets');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'ECAP Power Gas Delivery', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'ECAP Power Gas Delivery');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Enbridge Pennecon SLO Upgrade', 'Enbridge', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Enbridge Pennecon SLO Upgrade');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Goodfish A1 Demister Tubing', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Goodfish A1 Demister Tubing');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Goodfish A1 High Flow Cyclone', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Goodfish A1 High Flow Cyclone');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Hidden Lake North B2 High Flow Cyclone', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Hidden Lake North B2 High Flow Cyclone');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Latornell A2 High Flow Cyclone', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Latornell A2 High Flow Cyclone');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Old Castle Batching System Install', 'Old Castle', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Old Castle Batching System Install');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Otter Lake Tubing Installation', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Otter Lake Tubing Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Pipestone Creek A1 Low Flow Cyclone', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Pipestone Creek A1 Low Flow Cyclone');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'R 360 Maintenance', 'R 360', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'R 360 Maintenance');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Saddle Hills B3 High Flow Cyclone', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Saddle Hills B3 High Flow Cyclone');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Seacan Move Bens/Gadsby', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Seacan Move Bens/Gadsby');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Secure - Fox Creek TVP Analyzer', 'Secure Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Secure - Fox Creek TVP Analyzer');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Secure HMI SCADA Cutover', 'Secure Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Secure HMI SCADA Cutover');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Secure Shutdown Checks', 'Secure Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Secure Shutdown Checks');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Security System Upgrades Meikle River', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Security System Upgrades Meikle River');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Security System Upgrades Saddle Hills', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Security System Upgrades Saddle Hills');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Siemens Energy Saddle Hills C4 Outage', 'Siemens Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Siemens Energy Saddle Hills C4 Outage');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'STATION 2 Camera Installation', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'STATION 2 Camera Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Wilde Lake RTD Installation', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Wilde Lake RTD Installation');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Wilde Lake Seal Gas Booster Pump Install', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Wilde Lake Seal Gas Booster Pump Install');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Winchell SAVC', 'TC Energy', 'E.035534', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Winchell SAVC');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Wolf Lake A3 RB 211 Metal Scan', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Wolf Lake A3 RB 211 Metal Scan');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Woodenhouse C3 Demister Tubing', 'TC Energy', NULL, 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Woodenhouse C3 Demister Tubing');

-- 128407-220 Contract Series (16)
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Gadsby CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Gadsby CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Latornell CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Latornell CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Meikle CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Meikle CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Oakland CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Oakland CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Schrader CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Schrader CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Clear Water CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Clear Water CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Fox Creek CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Fox Creek CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Behan CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Behan CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Berland CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Berland CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Torrington CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Torrington CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Dusty Lake CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Dusty Lake CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Wooden House CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Wooden House CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Turner Valley CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Turner Valley CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Swartz ECAP CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Swartz ECAP CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Field Lake CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Field Lake CS Project - 128407-220');
INSERT INTO projects (name, client_name, estimate_no, status) SELECT 'Paul Lake CS Project - 128407-220', 'TC Energy', '128407-220', 'Archived' WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Paul Lake CS Project - 128407-220');

-- 3. Update any existing projects that might have wrong status/E#
-- (handles projects already in DB from earlier imports)
UPDATE projects SET status = 'Active', estimate_no = COALESCE(estimate_no, 'E.040770') WHERE name ILIKE '%Schrader%LDAR%Vent%' AND status != 'Active';
UPDATE projects SET status = 'Active', estimate_no = COALESCE(estimate_no, 'E.040770') WHERE name ILIKE '%Medicine Hat%LDAR%' AND status != 'Active';
UPDATE projects SET status = 'Active', estimate_no = COALESCE(estimate_no, 'E.027618') WHERE name ILIKE '%Wainwright%ECAP%' AND status != 'Active';
UPDATE projects SET status = 'Active' WHERE name ILIKE '%Leismer East%Fuel%Gas%' AND status != 'Active';
UPDATE projects SET status = 'Active' WHERE name ILIKE '%Wainwright LDAR%Vent%' AND status != 'Active';
UPDATE projects SET status = 'Active' WHERE name ILIKE '%Alces%Compressor%' AND status != 'Active';
UPDATE projects SET status = 'Estimating' WHERE name ILIKE '%Oakland%LDAR%Scrub%' AND status != 'Estimating';

END $$;

-- Run the count check outside the DO block
SELECT status, count(*) as count FROM projects GROUP BY status ORDER BY count DESC;
