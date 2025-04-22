<?php
class Geolocation {
    public $hostname;
    public $city;
    public $region;
    public $country;
    public $loc;
    public $org;
    public $postal;
    public $timezone;

    public function __construct($data = []) {
        $this->hostname = $data['hostname'] ?? 'Unknown';
        $this->city = $data['city'] ?? 'Unknown';
        $this->region = $data['region'] ?? 'Unknown';
        $this->country = $data['country'] ?? 'Unknown';
        $this->loc = $data['loc'] ?? 'Unknown';
        $this->org = $data['org'] ?? 'Unknown';
        $this->postal = $data['postal'] ?? 'Unknown';
        $this->timezone = $data['timezone'] ?? 'Unknown';
    }
}