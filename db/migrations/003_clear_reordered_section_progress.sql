DELETE FROM answer_records
WHERE section_id IN ('SEC-03', 'SEC-04');

DELETE FROM section_attempts
WHERE section_id IN ('SEC-03', 'SEC-04');
