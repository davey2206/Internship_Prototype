<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');


Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_caption);

class Caption_Manager
{
    private static $instance = null;
    public $captions_db;
    public $current_caption;
    //Constructor
    private function __construct()
    {
        $this->captions_db = new Caption_DB();
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new Caption_Manager();
        }
        return self::$instance;
    }

    public function getCaption($metadata, $language = "EN", $handle_author_newline = false)
    {
        if ($metadata->type_id == Kukudushi_type::Horoscope)
        {
            return $this->getHoroscope($metadata);
        }
        else
        {
            return $this->getGenericCaption($metadata, $language, $handle_author_newline);
        }
    }

    public function getHoroscopeTypeName($metadata)
    {
        $horoscope_id = $metadata->getValue(MetaData_Property::Horoscope_id);
        return $this->captions_db->getHoroscopeTypeName($horoscope_id);
    }

    public function getHoroscopeTypeNameFromId($horoscope_id)
    {
        return $this->captions_db->getHoroscopeTypeName($horoscope_id);
    }

    public function getHoroscopeTypeId($horoscope_name)
    {
        return $this->captions_db->getHoroscopeTypeId($horoscope_name);
    }

    
    public function getHoroscopeById($horoscope_id)
    {
        return $this->captions_db->getHoroscopeById($horoscope_id);
    }

    public function getAllHoroscopeTypes()
    {
        return $this->captions_db->getAllHoroscopeTypes();
    }

    public function getHoroscopeLastDateFromType($horoscope_type_id)
    {
        return $this->captions_db->getHoroscopeLastDateFromType($horoscope_type_id);
    }

    public function getLastGenericCaption($type_id)
    {
        return $this->captions_db->getLastGenericCaption($type_id);
    }

    public function getHoroscope($metadata)
    {
        $horoscope_id = $metadata->getValue(MetaData_Property::Horoscope_id);
        $language = $metadata->getValue(MetaData_Property::Language);

        $result = $this->captions_db->getHoroscope($horoscope_id, $language);
        $current_date = "";

        if (!empty($result))
        {
            if ($language == "EN")
            {
                setlocale(LC_ALL, "US");
                $current_date = date('M, d, Y');
            }
            else
            {
                setlocale(LC_ALL, "es_ES");
                $current_date = date('d-m-Y');
            }

            return $current_date . "\n" . $result->text;
        }
        return "";
    }


    public function insert_new_caption($caption_object, $old_caption_to_inactive = false) 
    {
        return $this->captions_db->insert_new_caption($caption_object, $old_caption_to_inactive);
    }

    public function insert_new_horoscope($horoscope_text, $horoscope_type_id, $lang)
    {
        $this->captions_db->insert_new_horoscope($horoscope_text, $horoscope_type_id, $lang);
    }

    public function horoscope_refresh_needed()
    {
	    return $this->captions_db->horoscope_refresh_needed();
    }

    public function update_last_caption($type_id)
    {
        $this->captions_db->last_caption_to_inactive($type_id);
    }

    public function getGenericCaption($metadata, $language = "EN", $handle_author_newline = false)
    {

        $current_caption = $this->captions_db->getGenericCaption($metadata);

        //No caption found
        if (empty($current_caption))
        {
            return "";
        }
        
        $caption = "";
        if ($language == "NL")
        {
            if ($handle_author_newline == true)
            {
                $caption = $this->addAuthorNewLine($current_caption->caption_NL);
            }
            else
            {
                $caption = $current_caption->caption_NL;
            }
        }
        else //only english
        {
            if ($handle_author_newline == true)
            {
                $caption = $this->addAuthorNewLine($current_caption->caption_EN);
            }
            else
            {
                $caption = $current_caption->caption_EN;
            }
        }
        return $caption;
    }

    private function addAuthorNewLine($caption)
    {
        // Find the last occurrence of '-'
        $lastDashPosition = strrpos($caption, '-');

        // Split the string into two parts
        $firstPart = substr($caption, 0, $lastDashPosition);
        $secondPart = "- ". substr($caption, $lastDashPosition + 1) . " -";

        // Combine with a newline
        $combinedString = trim($firstPart) . "\n" . trim($secondPart);
        return $combinedString;
    }

    public function countCaptionCharacters($caption)
    {
        return strlen($caption);
    }
}
?>