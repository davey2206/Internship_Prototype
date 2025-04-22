<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_caption);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

if (!class_exists('Caption_DB')) 
{
    class Caption_DB
    {
        private $logger;
        function __construct() 
        {
            $this->logger = new Logger();
        }
        public function getHoroscope($horoscope_id, $language)
        {
            $this->logger->debug("Fetching horoscope for ID: $horoscope_id and language: $language");

            $sql = "SELECT * FROM wp_kukudushi_horoscopes WHERE type_id = %d AND lang = %s ORDER BY date DESC";
            $result = DataBase::select($sql, [$horoscope_id, $language]);

            if (!empty($result))
            {
                $this->logger->info("Horoscope fetched successfully for ID: $horoscope_id");
                return $result[0];
            }

            $this->logger->error("Failed to fetch horoscope for ID: $horoscope_id");
            return null;
        }

        public function getHoroscopeById($horoscope_id)
        {
            $this->logger->debug("Fetching horoscope by ID: $horoscope_id");
            
            $sql = "SELECT * FROM wp_kukudushi_horoscope_types WHERE id = %d;";
            $result = DataBase::select($sql, [$horoscope_id]);

            if (!empty($result))
            {
                $this->logger->info("Horoscope type fetched successfully for ID: $horoscope_id");
                return $result[0];
            }

            $this->logger->error("Failed to fetch horoscope type by ID: $horoscope_id");
            return NULL;
        }

        public function getHoroscopeTypeName($horoscope_id)
        {
            $this->logger->debug("Fetching horoscope type name for ID: $horoscope_id");
            $sql = "SELECT * FROM wp_kukudushi_horoscope_types WHERE id = %d";
            $result = DataBase::select($sql, [$horoscope_id]);

            if (!empty($result))
            {
                $this->logger->info("Horoscope type name fetched successfully for ID: $horoscope_id");
                return strtolower($result[0]->name_EN);
            }
            $this->logger->error("Failed to fetch horoscope type name for ID: $horoscope_id");
            return "";
        }

        public function getHoroscopeTypeId($horoscope_name)
        {
            $this->logger->debug("Fetching horoscope type ID for name: $horoscope_name");
            $horoscopeNameData = ['name_EN' => $horoscope_name];

            $result = DataBase::select("SELECT id FROM wp_kukudushi_horoscope_types WHERE name_EN = %s", $horoscopeNameData);

            if (!empty($result)) 
            {
                $this->logger->info("Horoscope type ID fetched successfully for name: $horoscope_name");
                return $result[0]->id;
            }
            $this->logger->error("Failed to fetch horoscope type ID for name: $horoscope_name");
            return null;
        }


        public function getAllHoroscopeTypes()
        {
            $this->logger->debug("Fetching all horoscope types.");
            $result = DataBase::select("SELECT * FROM wp_kukudushi_horoscope_types;");

            if (!empty($result))
            {
                $this->logger->info("Successfully fetched all horoscope types.");
                return $result;
            }

            $this->logger->error("Failed to fetch all horoscope types.");
            return null;
        }

        public function getHoroscopeLastDateFromType($horoscope_type_id)
        {
            $this->logger->debug("Fetching last date for horoscope type ID: $horoscope_type_id");
            $data = ['type_id' => $horoscope_type_id];
            $result = DataBase::select("SELECT MAX(date) AS maxDate FROM wp_kukudushi_horoscopes WHERE lang = 'ES' AND type_id = %d", $data);

            if (!empty($result))
            {
                $this->logger->info("Successfully fetched last date for horoscope type ID: $horoscope_type_id");
                return $result->maxDate;
            }

            $this->logger->error("Failed to fetch last date for horoscope type ID: $horoscope_type_id");
            return null;
        }

        public function getLastGenericCaption($type_id)
        {
            $this->logger->debug("Fetching last generic caption for type ID: $type_id");
            $data = ['type' => $type_id];
            $result = DataBase::select("SELECT * FROM wp_kukudushi_captions WHERE type = %d AND is_active", $data);

            if (!empty($result))
            {
                $this->logger->info("Successfully fetched last generic caption for type ID: $type_id");
                return $result;
            }

            $this->logger->error("Failed to fetch last generic caption for type ID: $type_id");
            return null;
        }

        public function getGenericCaption($metadata)
        {
            $type_id = $metadata->type_id;
            $this->logger->debug("Fetching generic caption for type ID: $type_id with metadata.");

            if ($type_id == Kukudushi_type::Gospel_Animal_Tracker)
            {
                $type_id = Kukudushi_type::Gospel;
                $this->logger->debug("Making sure the correct Gospel caption is Fetched for Gospel Animal Tracker.");
            }

            $sql = "SELECT * FROM wp_kukudushi_captions WHERE type = %d AND is_active";
            $result = DataBase::select($sql, [$type_id]);

            if (!empty($result))
            {
                date_default_timezone_set('America/Curacao');
                $today = date("Y-m-d");
                $dateLastRefresh = $result[0]->used_date;

                $today_dt = new DateTime($today);
                $lastRefresh_dt = new DateTime($dateLastRefresh);

                if (($type_id == Kukudushi_type::Pink_Ribbon || $type_id == Kukudushi_type::Ride_for_the_Roses || $type_id == Kukudushi_type::Wisdom) && $lastRefresh_dt < $today_dt)
                {
                    $this->logger->info("Caption needs refresh for type ID: $type_id.");
                    return $this->getNewCaption($type_id); // Assuming getNewCaption is implemented elsewhere and logs its own operations.
                }
                else
                {
                    $this->logger->info("Returning existing caption for type ID: $type_id.");
                    return $result[0];
                }
            }

            $this->logger->error("Failed to fetch generic caption for type ID: $type_id.");
            return "";
        }

        private function getNewCaption($type)
        {
            $this->logger->debug("Attempting to update last used caption to inactive and get a new caption for type: $type");
            $table_name = 'wp_kukudushi_captions';
            $data = [
                'is_active' => 0,
                'times_used' => ['raw' => 'times_used + 1'], // Use raw SQL for increment
            ];
            $where = ['type' => $type, 'is_active' => 1];

            DataBase::updateWithRaw($table_name, $data, $where);
            $this->logger->info("Last used caption updated to inactive for type: $type");

            $select_sql = "SELECT * FROM wp_kukudushi_captions WHERE type = %d ORDER BY times_used ASC, id ASC LIMIT 1";
            $result = DataBase::select($select_sql, [$type]);

            if (!empty($result)) 
            {
                $id = $result[0]->id;
                $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
                $data = [
                    'is_active' => 1, 
                    'times_used' => ['raw' => 'times_used + 1'],
                    'used_date' => $dateTimeNow->format('Y-m-d H:i:s'),
                ];
                $where = ['id' => $id];

                DataBase::updateWithRaw($table_name, $data, $where);
                $this->logger->info("New caption activated for ID: $id, type: $type");

                return $result[0];
            }
            $this->logger->error("Failed to retrieve a new caption for type: $type");
            return null;
        }

        function last_caption_to_inactive($type_id)
        {
            $this->logger->debug("Updating last used caption to inactive for type ID: $type_id");
            $updateData = [
                'is_active' => 0,
                'times_used' => ['raw' => 'times_used + 1'],
            ];
            
            $where = [
                'type' => $type_id, 
                'is_active' => 1
            ];

            $resultUpdate = DataBase::updateWithRaw('wp_kukudushi_captions', $updateData, $where);

            if (!$resultUpdate) 
            {
                $this->logger->error("Failed to update last used caption for type ID: $type_id");
            }
            else
            {
                $this->logger->info("Last used caption updated to inactive for type ID: $type_id");
            }
        }


        function insert_new_caption($caption_object, $old_caption_to_inactive = false) 
        {
            if ($old_caption_to_inactive)
            {
                $this->last_caption_to_inactive($caption_object->type);
            }

            $this->logger->debug("Attempting to insert a new caption.");

            $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));
            // Default values for caption_NL and caption_EN if not set
            $caption_NL = isset($caption_object->caption_NL) ? $caption_object->caption_NL : '';
            $caption_EN = isset($caption_object->caption_EN) ? $caption_object->caption_EN : '';

            // Ensure that 'type' is set in $caption_object
            if (!isset($caption_object->type)) 
            {
                $this->logger->error("Caption type must be provided.");
                throw new InvalidArgumentException("Caption type must be provided.");
            }

            // Prepare data for insertion
            $data = [
                'type' => $caption_object->type,
                'caption_NL' => $caption_NL,
                'caption_EN' => $caption_EN,
                'is_active' => $caption_object->is_active ? 1 : 0,
                'used_date' => $dateTimeNow->format('Y-m-d H:i:s'),
                'added_datetime' => $dateTimeNow->format('Y-m-d H:i:s')
            ];

            $format = ['%d', '%s', '%s', '%d', '%s'];

            $result = DataBase::insert('wp_kukudushi_captions', $data, $format);

            // Check result and handle accordingly
            if ($result === false) 
            {
                $this->logger->error("Failed to insert new caption.");
                return false;
            } 
            else 
            {
                $this->logger->info("Successfully inserted new caption.");
                return true;
            }
        }

        public function insert_new_horoscope($horoscope_text, $horoscope_type_id, $lang)
        {
            $this->logger->debug("Attempting to insert a new horoscope.");

            $data = [
                'type_id' => $horoscope_type_id,
                'text' => $horoscope_text,
                'lang' => $lang,
                'date' => ['raw' => 'NOW()']
            ];

            $format = ['%d', '%s', '%s', 'raw'];
            $result = DataBase::insertIgnore('wp_kukudushi_horoscopes', $data, $format);

            if ($result === false) 
            {
                $this->logger->error("Failed to insert new horoscope.");
            }
            else
            {
                $this->logger->info("Successfully inserted new horoscope.");
            }
        }

        function horoscope_refresh_needed()
        {
            $this->logger->debug("Checking if horoscope refresh is needed.");

            //Set timezone Curacao
            date_default_timezone_set('America/Curacao');

            //get horoscope id from name
            $result = DataBase::select("SELECT MAX(date) AS maxDate FROM wp_kukudushi_horoscopes WHERE lang = 'ES'");

            $time1 = strtotime($result[0]->maxDate);
            $time2 = strtotime(date("Y-m-d"));

            if ($time1 < $time2)
            {
                $this->logger->info("Horoscope refresh is needed.");
                return True;
            }
            else
            {
                $this->logger->info("No horoscope refresh needed.");
                return False;
            }
        }
    }
}
?>