# 🚀 Render Deployment Configuration

## ⚠️ IMPORTANT: DO NOT USE BLUEPRINT!
Use individual services to avoid payment walls.

## Frontend Configuration (Static Site)
```
Service Type: Static Site
Name: socialflow-frontend
Root Directory: (empty)
Build Command: npm install && npm run build
Publish Directory: dist

Environment Variables:
VITE_API_URL=https://socialflow-backend.onrender.com
```

## Backend Configuration (Web Service)  
```
Service Type: Web Service
Name: socialflow-backend
Root Directory: backend
Environment: Node
Build Command: npm install && npx prisma generate
Start Command: npx prisma migrate deploy && npm start

Environment Variables:
NODE_ENV=production
DATABASE_URL=[your_neon_connection_string]
JWT_SECRET=LEv5DmQSg0L9gz6B2wtFW9HcTmL8VwAtU82r8l9ky5lQm9t41TfhQJm3bBFPuTSO4KX2QegqOJxnTLcRlWjugcoZsTeRu0OaRhwMRYsdyfnxP
CLIENT_URL=https://socialflow-frontend.onrender.com
```

## Essential Environment Variables for Backend

### Required (minimum setup):
- `NODE_ENV=production`
- `DATABASE_URL=[neon_postgresql_url]`
- `JWT_SECRET=[secure_random_string]`  
- `CLIENT_URL=[frontend_url]`

### Optional (add when needed):
- `OPENAI_API_KEY=[for_ai_content]`
- `HF_TOKEN=[for_hugging_face_ai]`
- `FACEBOOK_APP_ID=[for_instagram_oauth]`
- `FACEBOOK_APP_SECRET=[for_instagram_oauth]`
- `CLOUDINARY_CLOUD_NAME=[for_image_uploads]`
- `CLOUDINARY_API_KEY=[for_image_uploads]`
- `CLOUDINARY_API_SECRET=[for_image_uploads]`

## 📝 Deployment Steps Summary
1. Create Neon PostgreSQL database (free)
2. Deploy frontend as Static Site (manual setup)
3. Deploy backend as Web Service (manual setup)  
4. Add environment variables
5. Test deployment

## 🚨 Troubleshooting Payment Walls
- Never use "Blueprint" or "New Blueprint"
- Always use "New" → "Static Site" or "Web Service"
- Create services one by one
- Use individual Git repository connections

## 💡 Why This Works
- Each service is created individually on free tier
- No multi-service blueprint triggers
- Standard free tier limits apply
- No payment information required