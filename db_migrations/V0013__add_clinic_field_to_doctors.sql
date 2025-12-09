-- Добавление поля поликлиники для врачей
ALTER TABLE t_p30358746_hospital_website_red.doctors 
ADD COLUMN IF NOT EXISTS clinic VARCHAR(100) DEFAULT 'Центральная городская поликлиника';

-- Добавление комментария к полю
COMMENT ON COLUMN t_p30358746_hospital_website_red.doctors.clinic IS 'Поликлиника: Центральная городская поликлиника или Детская городская поликлиника';