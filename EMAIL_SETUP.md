# Email Configuration Guide (EmailJS)

This application uses **EmailJS** to send order receipt emails to customers. Follow these steps to configure it:

## 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a **FREE** account (up to 200 emails/month)
3. Verify your email address

## 2. Create Email Service

1. Go to **Email Services** in your EmailJS dashboard
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, Yahoo, etc.)
4. Follow the connection instructions
5. Copy your **Service ID** (e.g., `service_abc1234`)

## 3. Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template:

**Subject:** Order Confirmation - {{order_id}}

**Content:**
```
Hello {{to_name}},

Thank you for your order on CampusMarket!

Order ID: {{order_id}}
Order Date: {{order_date}}

Items:
{{items_list}}

Total Amount: {{total_amount}}
Payment Method: {{payment_method}}
Delivery Address: {{delivery_address}}

We'll notify you when your order status changes.

Best regards,
CampusMarket Team
```

4. Save and copy your **Template ID** (e.g., `template_xyz5678`)

## 4. Get Public Key

1. Go to **Account** → **General**
2. Find your **Public Key** (e.g., `abcdef123456`)

## 5. Update Configuration

Edit `src/app/services/email.service.ts` and update these values:

```typescript
private serviceId = 'service_abc1234'; // Your Service ID
private templateId = 'template_xyz5678'; // Your Template ID
private publicKey = 'abcdef123456'; // Your Public Key
```

## 6. Test Email

You can test the email functionality by:
1. Placing a test order
2. Check your email inbox
3. If emails don't arrive, check EmailJS dashboard logs

## Features

- ✅ Order confirmation emails sent automatically
- ✅ Includes order details and items
- ✅ FREE up to 200 emails/month
- ✅ No credit card required for free tier
- ✅ Works with any email provider

## Troubleshooting

- **Emails not sending?** Check EmailJS dashboard logs
- **Wrong email format?** Verify template variables match
- **Rate limit exceeded?** Upgrade EmailJS plan or reduce email sends

## Free Tier Limits

- 200 emails per month
- 1 email service
- 2 email templates
- Basic support

Perfect for small campus marketplace!
