module.exports = function(mongojs) {
    return [
        {
            "_id": mongojs.ObjectId("5785aa08396914150e536c8d"),
            "availableStart": new Date("2016-07-01T00:00:00.000Z"),
            "content": [
                {
                    "type": "HEADING",
                    "headingContent": "General"
                },
                {
                    "type": "TEXT_SHORT",
                    "questionStatement": "Do you have any comments on this task and tool?"
                },
                {
                    "type": "MULTIPLECHOICE_INLINE",
                    "questionStatement": "This activity was...",
                    "values": [
                        "Not enjoyable",
                        "...",
                        "Neutral",
                        "...",
                        "Enjoyable"
                    ]
                },
                {
                    "type": "HEADING",
                    "headingContent": "Understanding"
                },
                {
                    "type": "MULTIPLECHOICE_LIST",
                    "questionStatement": "After the chat, my level of understanding of the concepts discussed in this question is:",
                    "values": [
                        "I do not understand the concepts",
                        "I understand the concepts only a bit",
                        "I somewhat understand the concepts",
                        "I fully understand the concepts"
                    ]
                },
                {
                    "type": "HEADING",
                    "headingContent": "Quality of interaction"
                },
                {
                    "type": "MULTIPLECHOICE_LIST",
                    "questionStatement": "In the discussion...",
                    "values": [
                        "I gave my own ideas but did not really consider others ideas",
                        "I considered others ideas but did not really state my own",
                        "I gave my own ideas and I considered others ideas",
                        "I persisted in trying to understand and discuss even when others disagreed or wanted to give up"
                    ]
                },
                {
                    "type": "MULTIPLECHOICE_LIST",
                    "questionStatement": "In the discussion, our group...",
                    "values": [
                        "All stated their own ideas but with no real interaction",
                        "Mostly just agreed with the person/s who seem to know the answer",
                        "Discussed enough to get  the correct answer but not to understand why",
                        "Discussed ideas to gain some understanding",
                        "Debated ideas until all agreed and fully understood"
                    ]
                }
            ]
        }
    ]
}
