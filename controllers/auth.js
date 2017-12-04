const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const tokenSecret = require('../config').tokenSecret;
const helpers = require('./helpers');

module.exports = ({ User }, render) => {
  return {

    postLogout: async (ctx) => {
      if (ctx.user) {
        ctx.user.lastActive = Date.now();
        ctx.user.loggedIn = false;
        ctx.user.save();

        ctx.status = 200;
        return ctx.body = {
          success: true,
          loggedIn: false
        }
      }
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "Not Found",
        fullMessage: "Not logged in"
      }
    },

    postLogin: async (ctx) => {
      try {
        const data = helpers.getReqUserData(ctx);
        let user = await User.authenticate(data);
        if (user) {
          // ensuring user is not a mongoose object
          if (user._doc) user = user._doc;

          const token = jwt.sign({
            userId: user._id,
            lastActive: user.lastActive },
            tokenSecret
          );

          ctx.status = 200;
          const meta = user.__meta_;
          
          delete user.__meta_;
          delete user.password;
          user = Object.assign({}, user, meta)
          
          console.log('user logged in', user)

          return ctx.body = {
            success: true,
            token,
            user
          };
        }
        // no user
        throw new Error();
      }
      catch(err) {
        ctx.status = 403;
        return ctx.body = {
          success: false,
          message: 'User authentication failed',
          fullMessage: err.message
        };

      }
    },

    postRegister: async (ctx) => {
      try {
        const data = helpers.getReqUserData(ctx);
        let user = await User.create(data);
        
        if (user) {
          // ensuring user is not a mongoose object
          if (user._doc) user = user._doc;

          const token = jwt.sign({
            userId: user._id,
            lastActive: user.lastActive },
            tokenSecret
          );
          
          ctx.status = 200;
          const meta = user.__meta_;
          
          delete user.__meta_;
          delete user.password;

          return ctx.body = {
            success: true,
            token,
            user: Object.assign({}, user, meta)
          };
        }
        // no user
        throw new Error();
      }
      catch (err) {
        ctx.status = 400;
        return ctx.body = {
          success: false,
          message: 'User registration failed',
          fullMessage: err.message
        };

      }
    },

    putUser: async (ctx) => {
      try {
        const data = helpers.getReqUserData(ctx);
        let user = await User.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(ctx.params.id) },
            data,
            { new: true }
        );
          
        if (user) {
            // ensuring user is not a mongoose object
            if (user._doc) user = user._doc;
            
            ctx.status = 200;
            const meta = user.__meta_;
            
            delete user.__meta_;
            delete user.password;
            
            return ctx.body = {
                success: true,
                user: Object.assign({}, user, meta)
            };
        }
        // no user
        throw new Error();
      }
      catch (err) {
        ctx.status = 400;
        return ctx.body = {
          success: false,
          message: 'User update failed',
          fullMessage: err.message
        };

      }
    }
  }
}
