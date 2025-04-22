<?php
class Scan 
{
    // Basic scan properties
    public $id;
    public $valid;
    public $datetime;
    public $ip;
    public $ip_processed;
    public $kukudushi_id;
    public $temporary_id;
    public $browser;
    public $guid;
    public $metadata_id;
    public $window_functionality;
    public $username;

    // Change geolocation to public
    public $geolocation = null;

    public function __construct($data = null) 
    {
        if ($data) {
            foreach ($data as $key => $value) {
                if (property_exists($this, $key)) {
                    $this->$key = $value;
                }
            }
        }
    }

    // Getter for geolocation data
    public function getGeolocation() 
    {
        return $this->geolocation;
    }

    // Setter for geolocation data
    public function setGeolocation($geoData) 
    {
        $this->geolocation = $geoData;
        return $this;
    }

    // Convert geolocation data to array format for API response
    public function toArray() 
    {
        $data = [
            'id' => $this->id,
            'valid' => $this->valid,
            'datetime' => $this->datetime,
            'ip' => $this->ip,
            'ip_processed' => $this->ip_processed,
            'kukudushi_id' => $this->kukudushi_id,
            'temporary_id' => $this->temporary_id,
            'browser' => $this->browser,
            'guid' => $this->guid,
            'metadata_id' => $this->metadata_id,
            'window_functionality' => $this->window_functionality,
            'username' => $this->username
        ];

        // Add geolocation data if available
        if ($this->geolocation) {
            $geoData = [
                'geo_hostname' => $this->geolocation->hostname,
                'geo_city' => $this->geolocation->city,
                'geo_region' => $this->geolocation->region,
                'geo_country' => $this->geolocation->country,
                'geo_latitude' => $this->geolocation->latitude,
                'geo_longitude' => $this->geolocation->longitude,
                'geo_organization' => $this->geolocation->organization,
                'geo_postal' => $this->geolocation->postal_code,
                'geo_timezone' => $this->geolocation->timezone,
                // For backward compatibility
                'geo_loc' => isset($this->geolocation->latitude) && isset($this->geolocation->longitude) 
                    ? $this->geolocation->latitude . ',' . $this->geolocation->longitude 
                    : null
            ];
            
            $data = array_merge($data, $geoData);
        }

        return $data;
    }
}

// New class to handle geolocation data
class ScanGeolocation 
{
    public $id;
    public $ip_address;
    public $hostname;
    public $city;
    public $region;
    public $country;
    public $latitude;
    public $longitude;
    public $organization;
    public $postal_code;
    public $timezone;
    public $last_updated;
    public $status;

    public function __construct($data = null) 
    {
        if ($data) {
            foreach ($data as $key => $value) {
                if (property_exists($this, $key)) {
                    $this->$key = $value;
                }
            }
        }
    }

    public static function fromApiResponse($ipAddress, $apiData) 
    {
        $now = new DateTime('now', new DateTimeZone('America/Curacao'));
        
        return new self([
            'ip_address' => $ipAddress,
            'hostname' => $apiData['hostname'] ?? null,
            'city' => $apiData['city'] ?? null,
            'region' => $apiData['region'] ?? null,
            'country' => $apiData['country'] ?? null,
            'latitude' => $apiData['lat'] ?? null,
            'longitude' => $apiData['lng'] ?? null,
            'organization' => $apiData['org'] ?? null,
            'postal_code' => $apiData['postal'] ?? null,
            'timezone' => $apiData['timezone'] ?? null,
            'status' => 'active',
            'last_updated' => $now->format('Y-m-d H:i:s')
        ]);
    }
}