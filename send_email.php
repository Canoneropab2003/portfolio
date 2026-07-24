<?php
// Import PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// 1. Updated paths based on your folder structure (image_7cdc83.png)
require 'Assets/phpmailer/src/Exception.php';
require 'Assets/phpmailer/src/PHPMailer.php';
require 'Assets/phpmailer/src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 2. Verify reCAPTCHA
    $recaptchaSecret = 'YOUR_RECAPTCHA_SECRET_KEY'; // Put your Google reCAPTCHA secret key here
    $recaptchaResponse = $_POST['g-recaptcha-response'] ?? '';
    
    $verifyUrl = "https://www.google.com/recaptcha/api/siteverify?secret={$recaptchaSecret}&response={$recaptchaResponse}";
    $verifyResponse = file_get_contents($verifyUrl);
    $responseData = json_decode($verifyResponse);
    
    if (!$responseData->success) {
        http_response_code(400);
        echo json_encode(["message" => "reCAPTCHA verification failed."]);
        exit;
    }

    // 3. Get form fields safely
    $name = htmlspecialchars($_POST['name'] ?? '');
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $message = htmlspecialchars($_POST['message'] ?? '');

    // 4. Set up PHPMailer
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        
        // YOUR Gmail address and the App Password from image_7cdc64.png
        $mail->Username   = 'canonero4821@gmail.com'; 
        $mail->Password   = 'ihsqnsnzjfquxpdm'; // No spaces
        
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Recipients
        $mail->setFrom($email, $name); 
        $mail->addAddress('canonero4821@gmail.com', 'Your Name'); 
        $mail->addReplyTo($email, $name);

        // Email Content
        $mail->isHTML(false);
        $mail->Subject = 'New Contact Form Ticket #0009 from ' . $name;
        $mail->Body    = "Name: {$name}\nEmail: {$email}\n\nMessage:\n{$message}";

        $mail->send();
        
        http_response_code(200);
        echo json_encode(["message" => "Success!"]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}"]);
    }
} else {
    http_response_code(403);
    echo "Forbidden";
}
?>