'use strict';

const map = {
    // eslint-disable-next-line global-require
    'sitecues-js' : require('./build-map/sitecues-js')
};

const assumed = {
    branch  : 'master',
    version : 'latest'
};

const buildConf = (appName, siteId) => {
    const conf = map[appName];
    if (!conf) {
        return assumed;
    }

    const overriden = conf.siteOverride && conf.siteOverride[siteId];
    if (!overriden) {
        if (!conf.default) {
            return assumed;
        }
        return {
            branch  : conf.default.branch || assumed.branch,
            version : conf.default.version || assumed.version
        };
    }
    return {
        branch  : overriden.branch || conf.default.branch || assumed.branch,
        version : overriden.version || conf.default.version || assumed.version
    };
};

module.exports = buildConf;
