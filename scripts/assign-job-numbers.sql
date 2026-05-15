-- ============================================================
-- Assign THM-2026-XXX job numbers to Active projects
-- Ordered by start date from Ontraccr Master Schedule 2026
-- Also sets start_date for all matched projects
-- ============================================================

-- Active projects ordered by schedule start date
UPDATE projects SET internal_job_no = 'THM-2026-001', start_date = '2026-03-23' WHERE name = 'Winchell Lake Heater Piping Upgrade';
UPDATE projects SET internal_job_no = 'THM-2026-002', start_date = '2026-04-07' WHERE name = 'Dusty Lake Video Surveillance Implementation';
UPDATE projects SET internal_job_no = 'THM-2026-003', start_date = '2026-04-13' WHERE name = 'Behan DC Cable Theft Repair';
UPDATE projects SET internal_job_no = 'THM-2026-004', start_date = '2026-05-09' WHERE name = 'Wainwright LDAR Scrubber Vent Leaks';
UPDATE projects SET internal_job_no = 'THM-2026-005', start_date = '2026-05-10' WHERE name = 'Wainwright ECAP';
UPDATE projects SET internal_job_no = 'THM-2026-006', start_date = '2026-05-12' WHERE name = 'Denning Lake Grounding Cables Replacement';
UPDATE projects SET internal_job_no = 'THM-2026-007', start_date = '2026-05-16' WHERE name = '2026 ECAP - Gadsby';
UPDATE projects SET internal_job_no = 'THM-2026-008', start_date = '2026-05-17' WHERE name = 'Swartz Creek Seal Gas Booster Pump Installation';
UPDATE projects SET internal_job_no = 'THM-2026-009', start_date = '2026-05-25' WHERE name = 'Turner Valley Blowdown Vent Cap Install';
UPDATE projects SET internal_job_no = 'THM-2026-010', start_date = '2026-05-31' WHERE name = 'Berland Station Recycle Valve';
UPDATE projects SET internal_job_no = 'THM-2026-011', start_date = '2026-06-01' WHERE name = '2026 ECAP - Clear Water';
UPDATE projects SET internal_job_no = 'THM-2026-012', start_date = '2026-06-03' WHERE name = 'NGTL Leismer East Fuel Gas Upgrades';
UPDATE projects SET internal_job_no = 'THM-2026-013', start_date = '2026-06-12' WHERE name = '2026 ECAP - Field Lake';
UPDATE projects SET internal_job_no = 'THM-2026-014', start_date = '2026-06-14' WHERE name = 'Drywood - CS Air Comp Upgrade';
UPDATE projects SET internal_job_no = 'THM-2026-015', start_date = '2026-06-22' WHERE name = 'Meikle River D5 Booster Installation';
UPDATE projects SET internal_job_no = 'THM-2026-016', start_date = '2026-07-05' WHERE name = '2026 ECAP - Paul Lake';
UPDATE projects SET internal_job_no = 'THM-2026-017', start_date = '2026-07-10' WHERE name = 'Schrader Creek A1 Hot Recycle';
UPDATE projects SET internal_job_no = 'THM-2026-018', start_date = '2026-07-18' WHERE name = 'Shrader Creek - LDAR Vent Valve';
UPDATE projects SET internal_job_no = 'THM-2026-019', start_date = '2026-07-20' WHERE name = 'Hussar PFCC OSMB Upgrade';
UPDATE projects SET internal_job_no = 'THM-2026-020', start_date = '2026-07-20' WHERE name = 'Wolf Lake CS Unit A3 Fuel SAVC Upgrade';
UPDATE projects SET internal_job_no = 'THM-2026-021', start_date = '2026-07-20' WHERE name = 'Wolf Lake A3 Booster Installation';
UPDATE projects SET internal_job_no = 'THM-2026-022', start_date = '2026-07-20' WHERE name = 'Clearwater A6 Fan Upgrade';
UPDATE projects SET internal_job_no = 'THM-2026-023', start_date = '2026-08-01' WHERE name = 'Crowsnest Pass - ECAP';
UPDATE projects SET internal_job_no = 'THM-2026-024', start_date = '2026-08-08' WHERE name = 'Moyie CS Fire Eye - SITE VISIT';
UPDATE projects SET internal_job_no = 'THM-2026-025', start_date = '2026-08-10' WHERE name = 'Saddle Hills B3 Booster Installation';
UPDATE projects SET internal_job_no = 'THM-2026-026', start_date = '2026-08-15' WHERE name = 'Alces River - PLC Upgrade';
UPDATE projects SET internal_job_no = 'THM-2026-027', start_date = '2026-08-30' WHERE name = 'Knight Stn Failed Cables Replacement';
UPDATE projects SET internal_job_no = 'THM-2026-028', start_date = '2026-09-08' WHERE name = 'Behan CS Station Addition of High Resistance Ground System';
UPDATE projects SET internal_job_no = 'THM-2026-029', start_date = '2026-09-08' WHERE name = 'Alces River - Barton Flow Computer';
UPDATE projects SET internal_job_no = 'THM-2026-030', start_date = '2026-09-20' WHERE name = 'Saturn A1 Booster Installation';
UPDATE projects SET internal_job_no = 'THM-2026-031', start_date = '2026-10-12' WHERE name = 'Turner Valley - ECAP CS NPS 12 Blowdown Valve Replacement';
UPDATE projects SET internal_job_no = 'THM-2026-032', start_date = '2026-10-12' WHERE name = 'Turner Valley Fan Upgrades';
UPDATE projects SET internal_job_no = 'THM-2026-033', start_date = '2026-10-13' WHERE name = 'Gold Creek CS Unit B3 Starter Shut-off Valve & Piping Mods';
UPDATE projects SET internal_job_no = 'THM-2026-034', start_date = '2026-10-13' WHERE name = 'Nordegg B5 Booster Installation';
UPDATE projects SET internal_job_no = 'THM-2026-035', start_date = '2026-10-24' WHERE name = 'Beiseker - Cold Recycle Valve Replacement and Fire Protection';
UPDATE projects SET internal_job_no = 'THM-2026-036', start_date = '2026-10-24' WHERE name = 'Beiseker B3 Booster Installation';

-- Active projects not in Ontraccr schedule (assigned sequentially at end)
UPDATE projects SET internal_job_no = 'THM-2026-037' WHERE name = 'Burton Creek Heat Mitigation';
UPDATE projects SET internal_job_no = 'THM-2026-038' WHERE name = 'Burton Creek Cold Recycle Valve';
UPDATE projects SET internal_job_no = 'THM-2026-039' WHERE name = 'Materials 2026 Alces River Stn. & Unit B2 PLC Obsolescence';
UPDATE projects SET internal_job_no = 'THM-2026-040' WHERE name = 'Behan MCC Repair';
UPDATE projects SET internal_job_no = 'THM-2026-041' WHERE name = 'IronBird Contracting Option Excavating Saddle Hills HDD Vault Tie-In Spools';
UPDATE projects SET internal_job_no = 'THM-2026-042' WHERE name = 'Acme - ECAP Actuator Saddle Bracket Installation';
UPDATE projects SET internal_job_no = 'THM-2026-043' WHERE name = 'Nordegg Platform Install';
UPDATE projects SET internal_job_no = 'THM-2026-044' WHERE name = 'Ironbird Saddle Hills Pigging Chamber Flange Weld';
UPDATE projects SET internal_job_no = 'THM-2026-045' WHERE name = 'Secure - Fox Creek - LACT End Device Checks';
UPDATE projects SET internal_job_no = 'THM-2026-046' WHERE name = 'Bi-Annual PSV PMs';
UPDATE projects SET internal_job_no = 'THM-2026-047' WHERE name = 'Woodenhouse CS Video Surveillance - SITE VISIT';
UPDATE projects SET internal_job_no = 'THM-2026-048' WHERE name = 'Vetchland - ECAP Bracket Installation';
UPDATE projects SET internal_job_no = 'THM-2026-049' WHERE name = 'Saturn - A1 Fuel Gas Regulator Upgrade';
UPDATE projects SET internal_job_no = 'THM-2026-050' WHERE name = 'ECAP - Cost Estimate for Constructability Review and Site Visits';
UPDATE projects SET internal_job_no = 'THM-2026-051' WHERE name = 'Knight - Instrument Air Upgrade';
UPDATE projects SET internal_job_no = 'THM-2026-052' WHERE name = 'Turner Valley - A2 Exhaust Replacement';
UPDATE projects SET internal_job_no = 'THM-2026-053' WHERE name = 'Leismer East FG Isolation Upgrade';
UPDATE projects SET internal_job_no = 'THM-2026-054' WHERE name = 'Berland B2 Start Gas Level Switch';
UPDATE projects SET internal_job_no = 'THM-2026-055' WHERE name = 'Berland River - LDAR Capital Project - SITE VISIT';
UPDATE projects SET internal_job_no = 'THM-2026-056' WHERE name = '2026 NGTL LDAR Capital Project Wainwright';
UPDATE projects SET internal_job_no = 'THM-2026-057' WHERE name = '2026 NGTL Hussar A6/7/8 FG Meter and Flow Computer Upgrades - Site Visit';
UPDATE projects SET internal_job_no = 'THM-2026-058' WHERE name = '2026 Silencer Inspection Support';
UPDATE projects SET internal_job_no = 'THM-2026-059' WHERE name = 'Fox Creek - Inline TVP';
UPDATE projects SET internal_job_no = 'THM-2026-060' WHERE name = 'Alces River - PLC Obsolescence Constructability';
UPDATE projects SET internal_job_no = 'THM-2026-061' WHERE name = 'Alces Compressor Station – Station & Unit B2 Obsolescence Project';
UPDATE projects SET internal_job_no = 'THM-2026-062' WHERE name = 'Old Castle - Frame Repair';
UPDATE projects SET internal_job_no = 'THM-2026-063' WHERE name = 'Old Castle - Kiln Project';
UPDATE projects SET internal_job_no = 'THM-2026-064' WHERE name = 'Oldcastle Kiln Addition';
UPDATE projects SET internal_job_no = 'THM-2026-065' WHERE name = 'Turnqe - Frac 2/3 Turnaround';

-- Start dates for Estimating/Complete projects (no job number, just dates)
UPDATE projects SET start_date = '2026-03-22' WHERE name = 'ECAP Bracket Installation - Farrell Lake';
UPDATE projects SET start_date = '2026-04-06' WHERE name = 'Berland A1 GG Crane Ladder';
UPDATE projects SET start_date = '2026-04-13' WHERE name = '2026 Leismer East ACHE Fan Upgrade';
UPDATE projects SET start_date = '2026-05-27' WHERE name = 'Clearwater - PM Fan Upgrade C7';
UPDATE projects SET start_date = '2026-05-30' WHERE name = 'Berland River - Drywell Orifice Repair';
UPDATE projects SET start_date = '2026-05-30' WHERE name = 'Medicine Hat - LDAR Scrubber';
UPDATE projects SET start_date = '2026-05-31' WHERE name = 'Berland River - B3 Starter Vent Level Switch';
UPDATE projects SET start_date = '2026-06-01' WHERE name = 'Winchell Lake - Lube Oil Cooler Install';
UPDATE projects SET start_date = '2026-06-10' WHERE name = 'Groundbirch - Fuel Gas Upgrade';
UPDATE projects SET start_date = '2026-06-13' WHERE name = 'Oakland - LDAR Scrubber';
UPDATE projects SET start_date = '2026-06-15' WHERE name = 'Latornell - Fuel Gas Regulator Replacement';
UPDATE projects SET start_date = '2026-06-15' WHERE name = 'Latornell - Barton Flow Computer';
UPDATE projects SET start_date = '2026-06-22' WHERE name = 'Bigoray RMS Cleaning';
UPDATE projects SET start_date = '2026-07-22' WHERE name = 'Red Deer River - CS Air Comp Upgrade';
UPDATE projects SET start_date = '2026-07-30' WHERE name = 'Crowsnest - LDAR Scrubber';
UPDATE projects SET start_date = '2026-08-04' WHERE name = 'Crowsnest - B Barton 1130 Flow Computer';
UPDATE projects SET start_date = '2026-08-04' WHERE name = 'Crowsnest - A Barton 1130 Flow Computer';
UPDATE projects SET start_date = '2026-08-09' WHERE name = 'Hussar - Barton 1130 Flow Computer and PD Meter';
UPDATE projects SET start_date = '2026-08-16' WHERE name = 'Torrington - UPS Upgrade';
UPDATE projects SET start_date = '2026-09-01' WHERE name = 'Wilde Lake - PM Fan Upgrade';
UPDATE projects SET start_date = '2026-09-09' WHERE name = 'Elko - LDAR Scrubber';
UPDATE projects SET start_date = '2026-09-10' WHERE name = 'Elko - VIGV';
UPDATE projects SET start_date = '2026-09-15' WHERE name = 'Good Fish - CS Security Installation';
UPDATE projects SET start_date = '2026-09-15' WHERE name = 'Hidden Lake Security Installation';
UPDATE projects SET start_date = '2026-09-21' WHERE name = 'Woodenhouse - Air Comp Upgrade';
UPDATE projects SET start_date = '2026-09-28' WHERE name = 'Woodenhouse - Barton Flow Computer';
UPDATE projects SET start_date = '2026-09-28' WHERE name = 'Beiseker - VIGV';
UPDATE projects SET start_date = '2026-10-12' WHERE name = 'Goldcreek - B3 Starter Shutoff';
UPDATE projects SET start_date = '2026-10-13' WHERE name = 'Nordegg C6 Booster Installation';
UPDATE projects SET start_date = '2026-10-15' WHERE name = 'Woodenhouse - Security Installation';
UPDATE projects SET start_date = '2026-11-01' WHERE name = 'Jenner - Fuel and Utility Heat Ex Gas Detector';
UPDATE projects SET start_date = '2026-11-01' WHERE name = 'Woodenhouse - PM Fan Upgrade';
UPDATE projects SET start_date = '2026-11-15' WHERE name = 'Groundbirch - Security Installation';

-- Verify
SELECT internal_job_no, name, status, start_date
FROM projects
WHERE internal_job_no IS NOT NULL
ORDER BY internal_job_no;
