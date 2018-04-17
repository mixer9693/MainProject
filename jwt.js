var jwt = require('jsonwebtoken');

const refreshSecret = 'refreshSecret';
const accessSecret = 'accessSecret';

function createTokens(employeeId, role, performerId) {
    var payload = {employee_id: employeeId, role: role}
    if (performerId){
        payload['performer_id'] = performerId;
    }

    var accessToken = jwt.sign(payload, accessSecret, {expiresIn: '1d' });
    var refreshToken = jwt.sign(payload, refreshSecret, {expiresIn: '30d'});

    var data = {
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: jwt.decode(accessToken).exp,
        role: role,
        employeeId: employeeId
    }
    if (performerId) data.performerId = performerId
    return data;
}

function verifyAccessToken(token) {
    return jwt.verify(token, accessSecret);
}

function verifyRefreshToken(token) {
    return jwt.verify(token, refreshSecret);
}

module.exports.createTokens = createTokens;
module.exports.verifyAccessToken = verifyAccessToken;
module.exports.verifyRefreshToken = verifyRefreshToken;