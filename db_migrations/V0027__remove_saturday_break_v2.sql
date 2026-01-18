-- Убираем перерыв у субботы (day_of_week=5)
UPDATE doctor_schedules 
SET break_start_time = NULL, break_end_time = NULL 
WHERE doctor_id = 6 AND day_of_week = 5;
