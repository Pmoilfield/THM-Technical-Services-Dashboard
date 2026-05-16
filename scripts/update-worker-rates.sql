-- Fix worker default_rate_id assignments
-- Maps each worker to their correct rate record by name

UPDATE workers SET default_rate_id = '571b3ac2-2ea4-4461-bea8-658a7be536cb' WHERE name = 'Ben Gallivan';       -- Instrumentation – Technical Specialist
UPDATE workers SET default_rate_id = '13a68b15-6871-4feb-9e31-8af30567b862' WHERE name = 'Bret Rehill';        -- Project Management – Project Manager
UPDATE workers SET default_rate_id = '5b622a47-fdc7-446f-9510-a290b39be1d9' WHERE name = 'Danny Bowerman';     -- Pipefitter – General Foreman
UPDATE workers SET default_rate_id = 'e70f7ae5-96cf-4bdf-80cd-218b685e3722' WHERE name = 'Dj Labonte';         -- Electrical – Foreman
UPDATE workers SET default_rate_id = '475485cd-d327-488f-b1eb-824f04b326a7' WHERE name = 'Elliot Chevrier';    -- Welder – CWB with Rig
UPDATE workers SET default_rate_id = '117c8bd9-816a-4d5b-b242-a1dbd7a033e2' WHERE name = 'Eric Cheng';         -- Electrical – Journeyman / Lead Hand
UPDATE workers SET default_rate_id = 'f0593315-88d4-4493-a5f5-d7928ec84ebc' WHERE name = 'Evan Davio';         -- Electrical – Apprentice 3rd Year
UPDATE workers SET default_rate_id = '5a04bc99-0a2a-44e1-a2ea-5263898850dd' WHERE name = 'Ferras Atoui';       -- Pipefitter – Apprentice 3rd Year
UPDATE workers SET default_rate_id = '32da5d46-4520-4a6c-92a7-ff4aff3c6181' WHERE name = 'Joshua Garbe';       -- Project Management – Project Coordinator
UPDATE workers SET default_rate_id = '475485cd-d327-488f-b1eb-824f04b326a7' WHERE name = 'Maclcolm McKendrick';-- Welder – CWB with Rig
UPDATE workers SET default_rate_id = 'af8c063d-b7c3-47f9-a408-c9a73bf31bda' WHERE name = 'Matt Garbe';         -- Construction Management – General Superintendent
UPDATE workers SET default_rate_id = 'afe94549-52a4-4dde-8351-61b16cc0512d' WHERE name = 'Matt Garbutt';       -- Quality – Inspector Welding
UPDATE workers SET default_rate_id = '911789c3-55e9-4abb-92ed-310ff2906e2d' WHERE name = 'Megan Krasowski';    -- Administration – Project / Quality Admin
UPDATE workers SET default_rate_id = 'a6b23f7d-1b96-410f-99a7-6c51c9c29505' WHERE name = 'Parker McDougall';   -- Project Management – Senior Project Manager
UPDATE workers SET default_rate_id = '36cd198c-5bda-4847-a286-fb89ded7d8da' WHERE name = 'Paul Flynn';         -- Pipefitter – Journeyman / Lead Hand
UPDATE workers SET default_rate_id = '117c8bd9-816a-4d5b-b242-a1dbd7a033e2' WHERE name = 'Robert Fair';        -- Electrical – Journeyman / Lead Hand
UPDATE workers SET default_rate_id = '117c8bd9-816a-4d5b-b242-a1dbd7a033e2' WHERE name = 'Romeo Mahoro';       -- Electrical – Journeyman / Lead Hand
UPDATE workers SET default_rate_id = 'ebc02365-a003-4f3b-ae77-7967946e7a9c' WHERE name = 'Ryan MacDonald';     -- Electrical – General Foreman
UPDATE workers SET default_rate_id = '36cd198c-5bda-4847-a286-fb89ded7d8da' WHERE name = 'Ryan Smith';         -- Pipefitter – Journeyman / Lead Hand
UPDATE workers SET default_rate_id = '5b622a47-fdc7-446f-9510-a290b39be1d9' WHERE name = 'Travis Lee';         -- Pipefitter – General Foreman
UPDATE workers SET default_rate_id = 'ee36134f-834b-45b4-a250-7f7bbf5fe1a0' WHERE name = 'Tristan Zemlack';    -- Instrumentation – Apprentice 1st Year
UPDATE workers SET default_rate_id = 'f0593315-88d4-4493-a5f5-d7928ec84ebc' WHERE name = 'Tyler Daffurn';      -- Electrical – Apprentice 3rd Year
UPDATE workers SET default_rate_id = '4ddc760d-a669-4766-8488-a6f97e0c3fba' WHERE name = 'Ward McKetsy';       -- Instrumentation – Journeyman / Lead Hand
UPDATE workers SET default_rate_id = '3289eeda-e32d-44e6-83a3-9cb5f7d0af7a' WHERE name = 'Waylon Campbell';    -- Electrical – Apprentice 4th Year

-- Brandon Briltz, Geoff LePage, Wesley Milford — no trade in original data, left as NULL

-- Verify results
SELECT name, default_rate_id, r.category, r.personnel
FROM workers w
LEFT JOIN rates r ON r.id = w.default_rate_id
ORDER BY r.category, w.name;
