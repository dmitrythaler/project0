
// type JSONType = string|number|boolean
type JSONObject = Record<string, any>

const mapCourse = input => ({
  id: input.id,
  course_id: input.data.id,
  course_name: input.data.name,
  course_nameVO: input.data.nameVO,
  course_description: input.data.description,
  course_descriptionVO: input.data.descriptionVO || '',
  course_icon: input.data.icon,
  course_badge_icon: input.data.badgeIcon,
  course_displayOrder: input.data.displayOrder,
  course_successThreshold: input.data.successThreshold,
  course_failureThreshold: input.data.failureThreshold,
  course_guid: input.data.guid,
  course_sections: input.data.sections
})

const mapModule = input => ({
  id: input.id,
  module_id: input.data.id,
  course_id: input.data.courseId,
  module_name: input.data.name,
  module_nameVO: input.data.nameVO,
  module_description: input.data.description,
  module_descriptionVO: input.data.descriptionVO,
  module_icon: input.data.icon,
  module_badge_icon: input.data.badgeIcon,
  module_displayOrder: input.data.displayOrder,
  module_successThreshold: input.data.successThreshold,
  module_failureThreshold: input.data.failureThreshold,
  module_guid: input.data.guid,
  module_sections: input.data.sections
})

const mapTopic = input => ({
  id: input.id,
  module_id: input.data.moduleId[0],
  topic_id: input.data.id,
  topic_name: input.data.name,
  topic_nameVO: input.data.nameVO,
  topic_description: input.data.description,
  topic_descriptionVO: input.data.descriptionVO,
  topic_displayOrder: input.data.displayOrder,
  topic_isLocked: input.data.isLocked,
  topic_allowSkipToTest: input.data.allowSkipToTest,
  topic_successThreshold: input.data.successThreshold,
  topic_failureThreshold: input.data.failureThreshold,
  topic_guid: input.data.guid,
  topic_sections: input.data.sections
})

const mapItem = input => ({
  id: input.id,
  topic_id: input.data.topicId,
  item_id: input.data.id,
  item_name: input.data.name,
  item_caption: input.data.caption,
  item_nameVO: input.data.nameVO,
  item_description: input.data.description,
  item_image: input.data.image,
  item_guid: input.data.guid
})

const mapGlossary = input => ({
  id: input.data.id,
  bodyText: input.data.bodyText,
  bodyVO: input.data.bodyVO,
  media: input.data.media,
  guid: input.data.guid
})


export const mapAppData = (input: JSONObject): JSONObject => ({
  courses: [{
    total: input.course?.length || 0,
    items: input.course?.map(mapCourse) || []
  }],
  modules: [{
    total: input.module?.length || 0,
    items: input.module?.map(mapModule) || []
  }],
  topics: [{
    total: input.topic?.length || 0,
    items: input.topic?.map(mapTopic) || []
  }],
  items: [{
    total: input.item?.length || 0,
    items: input.item?.map(mapItem) || []
  }],
  glossary: [{
    total: input.glossary?.length || 0,
    items: input.glossary?.map(mapGlossary) || []
  }],
  assets: input.assets
})
