function jsonResponse(payload) {
  return ContentService.createTextOutput(
    JSON.stringify(payload),
  ).setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(code, message) {
  return {
    ok: false,
    error: {
      code: code,
      message: message,
    },
  };
}

const FACILITY_SESSION_TTL_SECONDS = 8 * 60 * 60;

function authenticateFacility_(body) {
  const expectedPin = PropertiesService.getScriptProperties().getProperty(
    'FACILITY_PIN',
  );

  if (!expectedPin) {
    throw new Error(
      'CONFIGURATION_ERROR: FACILITY_PINが未設定です。',
    );
  }

  if (!/^\d{8,12}$/.test(expectedPin)) {
    throw new Error(
      'CONFIGURATION_ERROR: FACILITY_PINは8〜12桁の数字で設定してください。',
    );
  }

  const suppliedPin = String(body.facilityPin || '');

  if (!/^\d{8,12}$/.test(suppliedPin) || suppliedPin !== expectedPin) {
    throw new Error(
      'AUTH_FAILED: 施設PINが正しくありません。',
    );
  }

  const sessionToken = Utilities.getUuid() + Utilities.getUuid();

  CacheService.getScriptCache().put(
    facilitySessionCacheKey_(sessionToken),
    '1',
    FACILITY_SESSION_TTL_SECONDS,
  );

  return {
    ok: true,
    sessionToken: sessionToken,
    expiresAt: new Date(
      Date.now() + FACILITY_SESSION_TTL_SECONDS * 1000,
    ).toISOString(),
  };
}

function requireFacilitySession_(body) {
  const sessionToken = String(body.sessionToken || '');

  if (!sessionToken || sessionToken.length < 32) {
    throw new Error(
      'AUTH_REQUIRED: 施設PINを入力してから利用してください。',
    );
  }

  const isValid = CacheService.getScriptCache().get(
    facilitySessionCacheKey_(sessionToken),
  );

  if (isValid !== '1') {
    throw new Error(
      'AUTH_REQUIRED: 施設PINの有効期限が切れました。もう一度入力してください。',
    );
  }
}

function facilitySessionCacheKey_(sessionToken) {
  return 'facility-session:' + sessionToken;
}

function toApiErrorResponse_(error) {
  const message =
    error && error.message
      ? String(error.message)
      : 'サーバーエラーが発生しました。';

  const separator = message.indexOf(': ');

  if (separator > 0) {
    const code = message.slice(0, separator);

    if (/^[A-Z_]+$/.test(code)) {
      return errorResponse(code, message.slice(separator + 2));
    }
  }

  return errorResponse('SERVER_ERROR', message);
}

function doPost(e) {
  try {
    const body = JSON.parse(
      (e && e.postData && e.postData.contents) || '{}',
    );

    switch (body.action) {
      case 'authenticateFacility':
        return jsonResponse(authenticateFacility_(body));

      case 'getMasters':
        requireFacilitySession_(body);

        return jsonResponse({
          ok: true,
          staff: getStaffMaster(),
          users: getUserMaster(),
        });

      case 'processAudio':
        requireFacilitySession_(body);

        return jsonResponse(processAudio(body));

      case 'saveRecords':
        requireFacilitySession_(body);

        return jsonResponse(saveRecords(body));

      default:
        return jsonResponse(
          errorResponse('UNKNOWN_ACTION', '未対応のactionです。'),
        );
    }
  } catch (error) {
    return jsonResponse(toApiErrorResponse_(error));
  }
}

function doGet() {
  return jsonResponse({
    ok: true,
    name: 'CareVoice API',
    authentication: 'facility-pin-required',
  });
}
