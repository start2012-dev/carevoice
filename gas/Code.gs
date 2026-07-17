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
