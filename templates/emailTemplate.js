const generateEmailHTML = (attachments, user) => {
    const generateAttachmentLinks = attachments
        .map(
            (attachment) => `
      <p>
        <strong>${attachment.originalName}</strong> - 
        <a href="${process.env.BASE_URL}:${process.env.PORT}${attachment.name}" download target="_blank" style="color: #007bff;">Download</a>
      </p>`
        )
        .join("");

    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Email Verification</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; color: #333;">
    <h2>Verify the Attachments</h2>
    <p>Verify the attachments in order to make the ${user.name} a creator. Below are the attachments:</p>
    
    <h2>Verification Token</h2>
    <p>${user.creator}</p>
    
    <div style="margin: 10px 0;">
      ${generateAttachmentLinks}
    </div>

    <div style="margin-top: 20px;">
      <a href="${process.env.FRONTEND_URL}/verify-creator" 
         style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify
      </a>
      
      <a href="${process.env.BASE_URL}:${process.env.PORT}/user/creatorVerificationApproved/${user.creator}/rejected" 
         style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-left: 10px;">
        Reject
      </a>
    </div>
  </body>
  </html>`;
};

module.exports = {generateEmailHTML};
