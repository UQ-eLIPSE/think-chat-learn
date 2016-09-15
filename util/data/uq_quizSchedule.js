module.exports = function(db) {
    return [
        {
            "_id": db.ObjectId("578344f6bcac356cb67c5c06"),
            "questionId": db.ObjectId("57834371bcac356cb67c5c05"),
            "course": "ENGG1200",
            "availableStart": new Date("2016-07-07T23:10:00.000Z"),
            "availableEnd": new Date("2016-07-14T04:30:00.000Z"),
            "blackboardColumnId": 238677
        },
        {
            "_id": db.ObjectId("5785e022396914150e536c93"),
            "questionId": db.ObjectId("5785df1c396914150e536c8e"),
            "course": "ENGG1200",
            "availableStart": new Date("2016-07-14T04:30:00.001Z"),
            "availableEnd": new Date("2016-07-14T06:00:00.000Z"),
            "blackboardColumnId": 238680
        },
        {
            "_id": db.ObjectId("5785e084396914150e536c94"),
            "questionId": db.ObjectId("57834371bcac356cb67c5c05"),
            "course": "ENGG1200",
            "availableStart": new Date("2016-07-14T06:00:00.001Z"),
            "availableEnd": new Date("2017-07-24T00:00:00.000Z"),
            "blackboardColumnId": 238681
        }
    ]
}
