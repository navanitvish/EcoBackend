const nodemailer = require('nodemailer');

// Create transporter with flexible credential checking
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  
  console.log('Email Configuration:');
  console.log('EMAIL_USER:', emailUser);
  console.log('EMAIL_PASS:', !!process.env.EMAIL_PASS);
  console.log('EMAIL_PASSWORD:', !!process.env.EMAIL_PASSWORD);
  console.log('Using password:', !!emailPass);
  
  if (!emailUser || !emailPass) {
    throw new Error('Missing email credentials. Set EMAIL_USER and EMAIL_PASS (or EMAIL_PASSWORD) in .env file');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
};

// Send OTP Email
const sendOTPEmail = async (email, otp, name) => {
  try {
    console.log(`\nSending OTP email to: ${email}`);
    
    const transporter = createTransporter();

    // Test connection first
    await transporter.verify();
    console.log('SMTP connection verified');

    const mailOptions = {
      from: {
        name: 'Be Infinity',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Verify your email with OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f8f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 40px 20px;">
            <tr>
              <td align="center">
                
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
                  
                  <tr>
                    <td style="background: linear-gradient(135deg, #ff3f6c, #ff527b); padding: 40px 40px 30px; text-align: center;">
                      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
                        Be Infinity
                      </h1>
                      <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 8px 0 0; font-weight: 400;">
                        Fashion • Beauty • Lifestyle
                      </p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px;">
                      
                      <h2 style="color: #282c3f; font-size: 24px; font-weight: 600; margin: 0 0 24px; line-height: 1.3;">
                        Hi ${name}!
                      </h2>
                      
                      <p style="color: #696e79; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                        Welcome to Be Infinity! We're excited to have you join our fashion community. 
                        Please verify your email address using the OTP below:
                      </p>
                      
                      <div style="background: linear-gradient(135deg, #ff3f6c, #ff527b); border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
                        <p style="color: white; font-size: 14px; font-weight: 500; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">
                          Your Verification Code
                        </p>
                        <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px; margin: 16px 0;">
                          <span style="color: white; font-size: 32px; font-weight: 700; letter-spacing: 6px; font-family: 'Courier New', monospace;">
                            ${otp}
                          </span>
                        </div>
                        <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 12px 0 0; font-weight: 400;">
                          Valid for 10 minutes only
                        </p>
                      </div>
                      
                      <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0;">
                        <h3 style="color: #282c3f; font-size: 16px; font-weight: 600; margin: 0 0 12px;">
                          What's next?
                        </h3>
                        <ul style="color: #696e79; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                          <li style="margin-bottom: 8px;">Enter this OTP on the verification page</li>
                          <li style="margin-bottom: 8px;">Complete your profile setup</li>
                          <li>Start exploring amazing fashion deals!</li>
                        </ul>
                      </div>
                      
                      <div style="border-left: 4px solid #ff3f6c; padding-left: 16px; margin: 24px 0;">
                        <p style="color: #696e79; font-size: 14px; line-height: 1.5; margin: 0;">
                          <strong style="color: #282c3f;">Security Note:</strong> Never share this OTP with anyone. 
                          If you didn't request this verification, please ignore this email.
                        </p>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="background: #282c3f; padding: 32px 40px; text-align: center;">
                      <p style="color: #a0a6b8; font-size: 14px; margin: 0 0 16px; line-height: 1.5;">
                        Need help? Contact our support team at support@beinfinity.com
                      </p>
                      <div style="border-top: 1px solid #3e4152; padding-top: 16px;">
                        <p style="color: #696e79; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} Be Infinity. All rights reserved.
                        </p>
                        <p style="color: #696e79; font-size: 12px; margin: 4px 0 0;">
                          This is an automated email. Please do not reply.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                </table>
                
              </td>
            </tr>
          </table>
          
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Email send error:', error);
    
    if (error.code === 'EAUTH') {
      console.error('Gmail Authentication Failed!');
      console.error('Solutions:');
      console.error('   1. Make sure 2-Factor Authentication is enabled on your Gmail');
      console.error('   2. Generate an App Password from Google Account Security settings');
      console.error('   3. Use the 16-character App Password (not your regular password)');
      console.error('   4. Check if EMAIL_USER and EMAIL_PASSWORD are correct in .env');
    }
    
    throw new Error('Failed to send email: ' + error.message);
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (order) => {
  try {
    console.log('Sending order confirmation email for order:', order.orderNumber);

    const transporter = createTransporter();

    const subtotal = order.subtotal || 0;
    const shippingCost = order.shippingCost || order.shipping || 0;
    const total = order.total || 0;
    
    const itemsHTML = (order.items || []).map(item => {
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 1;
      const itemTotal = itemPrice * itemQuantity;
      
      return `
        <tr>
          <td style="padding: 20px 0; border-bottom: 1px solid #f0f0f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="80" style="vertical-align: top;">
                  <img src="${item.image || '/placeholder-product.jpg'}" alt="${item.name || 'Product'}" 
                       style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; border: 1px solid #e0e0e0;">
                </td>
                <td style="padding-left: 16px; vertical-align: top;">
                  <h4 style="color: #282c3f; font-size: 16px; font-weight: 600; margin: 0 0 8px; line-height: 1.3;">
                    ${item.name || 'Product'}
                  </h4>
                  <p style="color: #94969f; font-size: 14px; margin: 0 0 8px;">
                    Qty: ${itemQuantity} | Size: ${item.size || 'N/A'}
                  </p>
                  <p style="color: #282c3f; font-size: 16px; font-weight: 700; margin: 0;">
                    ₹${itemTotal.toLocaleString('en-IN')}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }).join('');

    const customerName = order.userId?.name || 
                        order.shippingAddress?.name || 
                        order.customerName || 
                        'Valued Customer';
    
    const customerEmail = order.userId?.email || 
                         order.shippingAddress?.email || 
                         order.customerEmail;

    if (!customerEmail) {
      throw new Error('Customer email not found in order data');
    }

    const shippingAddress = order.shippingAddress || {};
    const addressLines = [
      shippingAddress.name || customerName,
      shippingAddress.street || shippingAddress.address || 'Address not provided',
      [shippingAddress.city, shippingAddress.state].filter(Boolean).join(', '),
      [shippingAddress.zip || shippingAddress.zipCode, shippingAddress.country].filter(Boolean).join(' - ')
    ].filter(line => line && line.trim() !== '').join('<br>');

    const mailOptions = {
      from: {
        name: process.env.COMPANY_NAME || 'Be Infinity',
        address: process.env.EMAIL_USER
      },
      to: customerEmail,
      subject: `Order Confirmed! #${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f8f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
                  
                  <tr>
                    <td style="background: linear-gradient(135deg, #ff3f6c 0%, #ff527b 100%); padding: 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 32px 40px; text-align: center;">
                            <h1 style="color: white; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px;">
                              BE INFINITY
                            </h1>
                            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0; font-weight: 400; text-transform: uppercase; letter-spacing: 2px;">
                              Fashion • Beauty • Lifestyle
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="background: #00d084; padding: 20px 40px; text-align: center;">
                      <p style="color: white; font-size: 18px; font-weight: 600; margin: 0;">
                        Order Confirmed Successfully!
                      </p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px;">
                      
                      <div style="margin-bottom: 32px;">
                        <h2 style="color: #282c3f; font-size: 24px; font-weight: 700; margin: 0 0 16px;">
                          Hey ${customerName}!
                        </h2>
                        <p style="color: #696e79; font-size: 16px; line-height: 1.6; margin: 0;">
                          Thank you for shopping with us! Your order has been confirmed and we're getting it ready for you.
                        </p>
                      </div>
                      
                      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #ff3f6c;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <h3 style="color: #282c3f; font-size: 18px; font-weight: 600; margin: 0;">
                                Order #${order.orderNumber}
                              </h3>
                              <p style="color: #696e79; font-size: 14px; margin: 4px 0 0;">
                                Placed on ${new Date().toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </p>
                            </td>
                            <td style="text-align: right;">
                              <div style="background: #282c3f; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                ${order.status || 'Confirmed'}
                              </div>
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <div style="margin-bottom: 32px;">
                        <h3 style="color: #282c3f; font-size: 18px; font-weight: 600; margin: 0 0 20px; padding-bottom: 12px; border-bottom: 2px solid #f0f0f0;">
                          Your Items (${(order.items || []).length})
                        </h3>
                        
                        <table width="100%" cellpadding="0" cellspacing="0">
                          ${itemsHTML}
                        </table>
                      </div>
                      
                      <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                        <h3 style="color: #282c3f; font-size: 18px; font-weight: 600; margin: 0 0 20px;">
                          Price Details
                        </h3>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                          <tr>
                            <td style="color: #696e79; padding: 8px 0;">Bag Total</td>
                            <td style="color: #282c3f; text-align: right; font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td style="color: #696e79; padding: 8px 0;">Shipping</td>
                            <td style="color: #282c3f; text-align: right; font-weight: 600;">
                              ${shippingCost === 0 ? '<span style="color: #00d084;">FREE</span>' : `₹${shippingCost.toLocaleString('en-IN')}`}
                            </td>
                          </tr>
                          <tr style="border-top: 1px solid #e0e0e0;">
                            <td style="color: #282c3f; padding: 16px 0 8px; font-size: 18px; font-weight: 700;">Total Amount</td>
                            <td style="color: #ff3f6c; text-align: right; font-size: 20px; font-weight: 800; padding: 16px 0 8px;">
                              ₹${total.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <div style="margin-bottom: 32px;">
                        <h3 style="color: #282c3f; font-size: 18px; font-weight: 600; margin: 0 0 16px;">
                          Delivery Address
                        </h3>
                        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                          <p style="color: #282c3f; font-size: 15px; line-height: 1.6; margin: 0; font-weight: 500;">
                            ${addressLines}
                          </p>
                        </div>
                      </div>
                      
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="#" style="background: linear-gradient(135deg, #ff3f6c, #ff527b); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                          Track Your Order
                        </a>
                      </div>
                      
                      <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 12px; padding: 24px; text-align: center;">
                        <h3 style="color: #282c3f; font-size: 18px; font-weight: 600; margin: 0 0 12px;">
                          What happens next?
                        </h3>
                        <p style="color: #696e79; font-size: 14px; line-height: 1.6; margin: 0;">
                          We'll send you updates as your order moves through our fulfillment process. 
                          You can track your order anytime using the link above.
                        </p>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="background: #282c3f; padding: 40px;">
                      
                      <div style="text-align: center; margin-bottom: 24px;">
                        <h4 style="color: white; font-size: 16px; font-weight: 600; margin: 0 0 16px;">
                          Stay Connected
                        </h4>
                        <p style="color: #a0a6b8; font-size: 14px; margin: 0 0 16px;">
                          Questions? We're here to help at support@beinfinity.com
                        </p>
                      </div>
                      
                      <div style="text-align: center; border-top: 1px solid #3e4152; padding-top: 24px;">
                        <p style="color: #696e79; font-size: 12px; margin: 0 0 8px;">
                          © ${new Date().getFullYear()} Be Infinity. All rights reserved.
                        </p>
                        <p style="color: #696e79; font-size: 12px; margin: 0;">
                          This email was sent to ${customerEmail}
                        </p>
                      </div>
                      
                    </td>
                  </tr>
                  
                </table>
                
              </td>
            </tr>
          </table>
          
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw new Error('Failed to send order confirmation email: ' + error.message);
  }
};

module.exports = {
  sendOTPEmail,
  sendOrderConfirmationEmail
};