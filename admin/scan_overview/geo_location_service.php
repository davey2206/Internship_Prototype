<?php
class GeoLocationService {
    private $logger;
    private static $instance = null;
    private $ipinfoToken = 'your_ipinfo_token';
    private $ip2LocationKey = 'your_ip2location_key'; // You'll need to get a free API key
    
    private function __construct() {
        $this->logger = new Logger();
    }
    
    public static function Instance() {
        if (self::$instance === null) {
            self::$instance = new GeoLocationService();
        }
        return self::$instance;
    }
    
    public function getLocationData($ip) {
        $this->logger->debug("Getting location for IP: " . $ip);
        
        try {
            // First try ipinfo.io
            $location = $this->getLocationFromIpInfo($ip);
            if ($location) {
                $this->logger->debug("Location found from ipinfo.io");
                return $location;
            }
            
            // Then try ip-api.com
            $location = $this->getLocationFromIpApiCom($ip);
            if ($location) {
                $this->logger->debug("Location found from ip-api.com");
                return $location;
            }
            
            // Then try ipapi.co
            $location = $this->getLocationFromIpApiCo($ip);
            if ($location) {
                $this->logger->debug("Location found from ipapi.co");
                return $location;
            }

            // Then try ip2location
            $location = $this->getLocationFromIp2Location($ip);
            if ($location) {
                $this->logger->debug("Location found from ip2location");
                return $location;
            }

            // Final fallback: Try geolocation-db.com
            $location = $this->getLocationFromGeolocationDb($ip);
            if ($location) {
                $this->logger->debug("Location found from geolocation-db.com");
                return $location;
            }
            
            $this->logger->error("No location data found from any service for IP: " . $ip);
            return null;
        } catch (Exception $e) {
            $this->logger->error("Error in getLocationData: " . $e->getMessage());
            return null;
        }
    }

    private function getLocationFromIp2Location($ip) {
        try {
            $url = "https://api.ip2location.com/v2/?ip={$ip}&key={$this->ip2LocationKey}&package=WS3";
            $response = $this->makeHttpRequest($url);
            
            if (!$response) return null;
            
            $data = json_decode($response, true);
            if ($data && !isset($data['error'])) {
                return [
                    'lat' => $data['latitude'] ?? null,
                    'lng' => $data['longitude'] ?? null,
                    'city' => $data['city_name'] ?? '',
                    'country' => $data['country_name'] ?? '',
                    'region' => $data['region_name'] ?? '',
                    'postal' => $data['zip_code'] ?? '',
                    'timezone' => $data['time_zone'] ?? '',
                    'org' => '',
                    'hostname' => null
                ];
            }
        } catch (Exception $e) {
            $this->logger->error("Error in getLocationFromIp2Location: " . $e->getMessage());
        }
        return null;
    }

    private function getLocationFromGeolocationDb($ip) {
        try {
            $url = "https://geolocation-db.com/json/{$ip}&position=true";
            $response = $this->makeHttpRequest($url);
            
            if (!$response) return null;
            
            $data = json_decode($response, true);
            if ($data && isset($data['latitude'])) {
                return [
                    'lat' => $data['latitude'] ?? null,
                    'lng' => $data['longitude'] ?? null,
                    'city' => $data['city'] ?? '',
                    'country' => $data['country_name'] ?? '',
                    'region' => $data['state'] ?? '',
                    'postal' => $data['postal'] ?? '',
                    'timezone' => null,
                    'org' => '',
                    'hostname' => null
                ];
            }
        } catch (Exception $e) {
            $this->logger->error("Error in getLocationFromGeolocationDb: " . $e->getMessage());
        }
        return null;
    }
    
    private function getLocationFromIpApiCom($ip) {
        try {
            $url = "http://ip-api.com/json/" . $ip;
            $response = $this->makeHttpRequest($url);
            
            if (!$response) return null;
            
            $data = json_decode($response, true);
            if ($data && $data['status'] === 'success') {
                return [
                    'lat' => $data['lat'] ?? null,
                    'lng' => $data['lon'] ?? null,
                    'city' => $data['city'] ?? '',
                    'country' => $data['country'] ?? '',
                    'region' => $data['regionName'] ?? '',
                    'postal' => $data['zip'] ?? '',
                    'timezone' => $data['timezone'] ?? '',
                    'org' => $data['org'] ?? $data['isp'] ?? '',
                    'hostname' => null  // Explicitly set hostname
                ];
            }
        } catch (Exception $e) {
            $this->logger->error("Error in getLocationFromIpApiCom: " . $e->getMessage());
        }
        return null;
    }

    private function getLocationFromIpApiCo($ip) {
        try {
            $url = "https://ipapi.co/{$ip}/json/";
            $response = $this->makeHttpRequest($url);
            
            if (!$response) return null;
            
            $data = json_decode($response, true);
            if ($data && !isset($data['error'])) {
                return [
                    'lat' => $data['latitude'] ?? null,
                    'lng' => $data['longitude'] ?? null,
                    'city' => $data['city'] ?? '',
                    'country' => $data['country_name'] ?? '',
                    'region' => $data['region'] ?? '',
                    'postal' => $data['postal'] ?? '',
                    'timezone' => $data['timezone'] ?? '',
                    'org' => $data['org'] ?? '',
                    'hostname' => null  // Explicitly set hostname to null
                ];
            }
        } catch (Exception $e) {
            $this->logger->error("Error in getLocationFromIpApiCo: " . $e->getMessage());
        }
        return null;
    }
    
    private function getLocationFromIpInfo($ip) {
        try {
            $url = "https://ipinfo.io/{$ip}/json" . ($this->ipinfoToken ? "?token={$this->ipinfoToken}" : "");
            $response = $this->makeHttpRequest($url);
            
            if (!$response) return null;
            
            $data = json_decode($response, true);
            if ($data && isset($data['loc'])) {
                list($lat, $lng) = explode(',', $data['loc']);
                return [
                    'lat' => floatval($lat),
                    'lng' => floatval($lng),
                    'city' => $data['city'] ?? '',
                    'country' => $data['country'] ?? '',
                    'region' => $data['region'] ?? '',
                    'postal' => $data['postal'] ?? '',
                    'timezone' => $data['timezone'] ?? '',
                    'org' => $data['org'] ?? ''
                ];
            }
        } catch (Exception $e) {
            $this->logger->error("Error in getLocationFromIpInfo: " . $e->getMessage());
        }
        return null;
    }
    
    private function makeHttpRequest($url, $retries = 3, $timeout = 15) {
        for ($i = 0; $i <= $retries; $i++) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'KukudushiEngine/1.0');
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
            
            $response = curl_exec($ch);
            
            if ($response === false) {
                $error = curl_error($ch);
                curl_close($ch);
                
                if ($i < $retries) {
                    $this->logger->debug("Request failed, attempt " . ($i + 1) . " of " . ($retries + 1) . ": " . $error);
                    sleep(1);  // Wait 1 second before retrying
                    continue;
                }
                
                $this->logger->error("cURL error: " . $error);
                return null;
            }
            
            curl_close($ch);
            return $response;
        }
        return null;
    }
}