export interface ILTIData {
    // Generic
    [key: string]: any; // Value generally should be string, but specified as any for safety

    // Required
    lti_message_type: string;
    lti_version: string;

    oauth_callback: string;
    oauth_consumer_key: string;
    oauth_nonce: string;
    oauth_signature: string;
    oauth_signature_method: string;
    oauth_timestamp: string;
    oauth_version: string;

    // Referred quiz
    custom_quizid: string;

    // Optional
    context_id?: string;
    context_label?: string;
    context_title?: string;
    context_type?: string;

    ext_ims_lis_memberships_id?: string;
    ext_ims_lis_memberships_url?: string;
    ext_lms?: string;

    launch_presentation_document_target?: string;
    launch_presentation_locale?: string;
    launch_presentation_return_url?: string;

    lis_course_offering_sourcedid?: string;
    lis_course_section_sourcedid?: string;
    lis_person_contact_email_primary?: string;
    lis_person_name_family?: string;
    lis_person_name_full?: string;
    lis_person_name_given?: string;
    lis_person_sourcedid?: string;

    resource_link_id?: string;
    resource_link_title?: string;

    roles?: string;

    tool_consumer_info_product_family_code?: string;
    tool_consumer_info_version?: string;
    tool_consumer_instance_contact_email?: string;
    tool_consumer_instance_description?: string;
    tool_consumer_instance_guid?: string;
    tool_consumer_instance_name?: string;
    tool_consumer_instance_url?: string;

    user_id?: string;
}
