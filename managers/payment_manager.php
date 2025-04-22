<?php
require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::manager_settings);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_points);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_payment);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_points_type);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_points);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_payment);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_payment_type);

class Payment_Manager
{
    private static $instance = null;
    private $settings;
    private $Points_DB;
    private $Payment_DB;
    private $logger;

    private $POINTS_PER_CENT = 2;

    private function __construct()
    {
        $this->settings = Settings_Manager::Instance();
        $this->Points_DB = new Points_DB();
        $this->Payment_DB = new Payment_DB();
        $this->logger = new Logger();
    }

    public static function Instance()
    {
        if (self::$instance === null) 
        {
            self::$instance = new Payment_Manager();
        }
        return self::$instance;
    }

    public function register_payment($kukudushi_id, $status, $order_id_pay_nl, $payment_session_id, $ip_address, $amount_in_cents)
    {
        $dateTimeNow = new DateTime('now', new DateTimeZone('America/Curacao'));

        if ($status == "PAID")
        {
            $amount_in_points = $this->donation_amount_to_points_amount($amount_in_cents);

            //Instantiate Points object
            $points_object = new Points();
            $points_object->kukudushi_id = $kukudushi_id;
            $points_object->amount = $amount_in_points;
            $points_object->description = 'Donation successful! '. $amount_in_points .' Kuku\'s awarded!';
            $points_object->date = $dateTimeNow->format('Y-m-d H:i:s');

            //Register points
            $points_id = $this->Points_DB->register($points_object);
            $this->logger->info("PAID donation - processed points; payment amount: ". strval($amount_in_cents) .", converted to ". strval($amount_in_points) ." Kuku's awarded.");

            //Register payment in Woocommerce
            $amount_full = $amount_in_cents / 100.0; //convert to full euro's (float)
            $wordpress_order_id = $this->Payment_DB->create_woocommerce_order_completed_generic($amount_full);
            $this->logger->info("PAID donation - processed wordpress order.");

            //Instantiate Payment object
            $payment_object = new Payment();
            $payment_object->kukudushi_id = $kukudushi_id;
            $payment_object->status = $status;
            $payment_object->order_id_wordpress = $wordpress_order_id;
            $payment_object->order_id_pay_nl = $order_id_pay_nl;
            $payment_object->payment_session_id = $payment_session_id;
            $payment_object->ip_address = $ip_address;
            $payment_object->amount = $amount_full;
            $payment_object->points_id = $points_id;
            $payment_object->type = Payment_type::Points;
            $payment_object->date = $dateTimeNow->format('Y-m-d H:i:s');

            //Register payment in database
            $payment_id = $this->Payment_DB->register_payment($payment_object);
            $this->logger->info("PAID donation - processed successfully for order ID PAY.nl: $order_id_pay_nl, kukudushi payment_id = $payment_id.");

        }
        else if ($status == "CANCEL")
        {
            //Instantiate Payment object
            $payment_object = new Payment();
            $payment_object->kukudushi_id = $kukudushi_id;
            $payment_object->status = $status;
            //$payment_object->order_id_wordpress = $wordpress_order_id;
            $payment_object->order_id_pay_nl = $order_id_pay_nl;
            $payment_object->payment_session_id = $payment_session_id;
            $payment_object->ip_address = $ip_address;
            $payment_object->amount = $amount_in_cents / 100.0; //convert to full euro's (float)
            //$payment_object->points_id = $points_id;
            $payment_object->type = Payment_type::Points;
            $payment_object->date = $dateTimeNow->format('Y-m-d H:i:s');

            //Register payment in database
            $payment_id = $this->Payment_DB->register_payment($payment_object);
            $this->logger->info("Cancelled donation - processed successfully for order ID PAY.nl: $order_id_pay_nl, kukudushi payment_id = $payment_id.");
        }
        else //Unknown statusses
        {
            //Instantiate Payment object
            $payment_object = new Payment();
            $payment_object->kukudushi_id = $kukudushi_id ?? "";
            $payment_object->status = $status ?? "";
            //$payment_object->order_id_wordpress = $wordpress_order_id;
            $payment_object->order_id_pay_nl = $order_id_pay_nl ?? "";
            $payment_object->payment_session_id = $payment_session_id ?? "";
            $payment_object->ip_address = $ip_address ?? "";
            $payment_object->amount = ($amount_in_cents ?? 0) / 100.0; //convert to full euro's (float)
            //$payment_object->points_id = $points_id;
            $payment_object->type = Payment_type::Points;
            $payment_object->date = $dateTimeNow->format('Y-m-d H:i:s');

            //Register payment in database
            $payment_id = $this->Payment_DB->register_payment($payment_object);
            $this->logger->info("Donation with unknown/unrecognised status - processed successfully for order ID PAY.nl: $order_id_pay_nl, kukudushi payment_id = $payment_id..");
        }

    }

    public function donation_amount_to_points_amount($donation_amount)
    {
        $points_amount = $donation_amount * $this->POINTS_PER_CENT;
        return $points_amount;
    }

}
?>