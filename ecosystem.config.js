module.exports = {
  apps : [{
    name: "www",
    script: 'bin/www',
    watch: '.',
    env: {
      "NODE_ENV": "production",
    }
  }],

  deploy : {
    production : {
      user : 'admin',
      host : ['206.189.65.34'],
      ref  : 'origin/master',
      repo : 'git@github.com:wesbdss/Backend_EasyLine.git',
      path : '.',
      'post-deploy' : 'yarn install && pm2 reload ecosystem.config.js --env production',
    }
  }
};
