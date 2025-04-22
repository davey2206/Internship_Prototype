<?php
//load wordpress
require_once(dirname(__FILE__, 5) . '/wp-load.php');

require_once(dirname(__FILE__, 2) . '/managers/includes_manager.php');

Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_payment);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::obj_type_payment_type);
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

class Payment_DB
{
    const KUKU_POINTS_PRODUCT_ID = 4214;

    public function register_payment($payment_object)
    {
        $data = array(
            'kukudushi_id' => $payment_object->kukudushi_id,
            'status' => $payment_object->status,
            'order_id_wordpress' => $payment_object->order_id_wordpress,
            'order_id_pay_nl' => $payment_object->order_id_pay_nl,
            'payment_session_id' => $payment_object->payment_session_id,
            'ip_address' => $payment_object->ip_address,
            'amount' => $payment_object->amount,
            'points_id' => $payment_object->points_id,
            'type' => $payment_object->type,
            'date' => $payment_object->date
        );

        $format = array('%s', '%s', '%d', '%s', '%d', '%s', '%d', '%d', '%s', '%s');
        $payment_id = DataBase::insert('wp_kukudushi_payments', $data, $format);
        return $payment_id;
    }

    function create_woocommerce_order_completed_generic($payment_amount) 
    {
        // Ensure WC is loaded
        if ( ! function_exists( 'WC' ) ) 
        {
            return;
        }

        // Convert amount to cents, multiply by 2 to get kuku points
        $kuku_points_amount = $payment_amount * 100 * 2;
    
        // Create an instance of WC_Order object
        $order = wc_create_order();

        // Create an instance of WC_Product object
        $product = wc_get_product(self::KUKU_POINTS_PRODUCT_ID);
        
        // Add a generic product (dummy product ID) to the order
        $order->add_product($product, $kuku_points_amount); // Adjust quantity as needed
        
        // If using a dummy customer, set the customer ID, else comment out this line for guest orders
        // Make sure to replace '2' with your dummy customer ID or remove to use guest checkout
        // $order->set_customer_id(2);
    
        // Set order total manually - set this to the total amount paid
        $order->set_total($payment_amount); // Adjust this to match the payment amount
    
        // Optional: Set billing and shipping details
        // You can programmatically set billing and shipping information if required
        // $order->set_address($address, 'billing');
        // $order->set_address($address, 'shipping');
    
        // Set order status to completed
        $order->update_status('completed', 'Order created programmatically - ', TRUE);
    
        // Save the order
        $order->save();
    
        return $order->get_id(); // Returns the order ID
    }
}
?>