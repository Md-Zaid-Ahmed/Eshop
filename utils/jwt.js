const jwt = require('jsonwebtoken')

const jwtAuthMiddleWare = (req,res, next) =>{


  const authorization = req.headers.authorization
  if(!authorization) return res.status(401).json({error : 'Invalid Token'})

  const token = req.headers.authorization.split(' ')[1];

  if(!token)
    return res.status(401).json({error : 'Unauthorized'})

  try {
     //verify jwt
     const decoedPayload = jwt.verify(token,process.env.JWT_SECRET);
     
     req.user = decoedPayload
     next();
  }
  catch(err){
    console.log(err)
    res.status(401).json({error : 'Invalid Token'})
  }

}

// Function to generate a JWT token
const generateToken = (payload) => {
  const secretKey = process.env.JWT_SECRET; 
  // const options = { expiresIn: "1h" };
  return jwt.sign(payload, secretKey);
};

module.exports = { generateToken,jwtAuthMiddleWare };
