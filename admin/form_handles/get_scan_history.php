<?php
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
require_once(dirname(__FILE__, 3) . '/managers/includes_manager.php');
Includes_Manager::Instance()->include_php_file(Include_php_file_type::db_database);

// Function for date validation
function validateDate($date, $format = 'Y-m-d') 
{
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

// Table name
$table_name = "wp_kukudushi_item_scans";

// Read value
$draw = $_POST['draw'];
$row = intval($_POST['start']);
$rowperpage = intval($_POST['length']); // Rows display per page
$columnIndex = $_POST['order'][0]['column']; // Column index
$columnName = $_POST['columns'][$columnIndex]['data']; // Column name
$columnSortOrder = $_POST['order'][0]['dir']; // asc or desc
$searchValue = $_POST['search']['value']; // Search value

$date_from = $_POST['date_from'];
$date_to = $_POST['date_to'];

// Search
$searchQuery = " ";
if($searchValue != '')
{
    // Assuming your DataBase class sanitizes input in the select method
    $searchQuery = " and (ip like %s or kukudushi_id like %s or browser like %s or guid like %s or window_functionality like %s or username like %s)";
    $searchParams = ["%$searchValue%", "%$searchValue%", "%$searchValue%", "%$searchValue%", "%$searchValue%", "%$searchValue%"];
} 
else 
{
    $searchParams = [];
}

// Check datetime
if (validateDate($date_from)) 
{
    $searchQuery .= " and datetime >= %s";
    $searchParams[] = $date_from;
}

if (validateDate($date_to)) 
{
    $searchQuery .= " and datetime <= %s";
    $searchParams[] = $date_to;
}

// Total number of records without filtering
$records = DataBase::select("SELECT count(*) as allcount FROM " . $table_name);
$totalRecords = $records[0]->allcount;

// Total number of records with filtering
$filteredQuery = "SELECT count(*) as allcount FROM " . $table_name . " WHERE 1 " . $searchQuery;
$records = DataBase::select($filteredQuery, $searchParams);
$totalRecordwithFilter = $records[0]->allcount;

// Fetch records
$fetchQuery = "SELECT * FROM " . $table_name . " WHERE 1 " . $searchQuery . " ORDER BY $columnName $columnSortOrder LIMIT %d, %d";

// Append limit parameters at the end of searchParams array
array_push($searchParams, $row, $rowperpage);
$scanRecords = DataBase::select($fetchQuery, $searchParams);

$data = [];
foreach ($scanRecords as $row) 
{
    $data[] = array(
        "id" => $row->id,
        "valid" => $row->valid,
        "datetime" => $row->datetime,
        "ip" => $row->ip,
        "kukudushi_id" => $row->kukudushi_id,
        "browser" => $row->browser,
        "guid" => $row->guid,
        "metadata_id" => $row->metadata_id,
        "window_functionality" => $row->window_functionality,
        "username" => $row->username
    );
}

// Response
$response = array(
    "draw" => intval($draw),
    "iTotalRecords" => $totalRecords,
    "iTotalDisplayRecords" => $totalRecordwithFilter,
    "aaData" => $data
);

echo json_encode($response);
?>