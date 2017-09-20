# reminderJs
A Javascript reminder library for the browser.

## Installation
```
    <script src="./js/reminderjs-1.0.0.js"></script>                     <!-- Include the ReminderJS library -->
```

## Use
```
ReminderJs.init(options);
```

### options
```
ReminderJs.init(
{
    "snoozeInterval" : 10,
    "position" : "topRight",
    "responsePayloadStructure" : {
            idField: 'reminder_id'
            titleField: 'reminder_title',
            descriptionField: 'reminder_short_description',
            timeStampField: 'reminder_datetime'
        },
    cssClassList: ["animate", "bounceInLeft"], //animate.css classes to animate (not included with this library)
    completionCallback: function(reminder){
        //do something with the completed reminder. ex: save completion flag to DB
    },
    snoozeCallback: function(reminder){
        //do something with the snoozed reminder.
    },
    reminderDisplayCallback: function(reminder){
        //do something with the displayed reminder. ex: updating your active reminders count balloon/label
    },
    reminderList : [
         {
             reminder_id : '1234567',
             reminder_title: 'Callback reminder',
             reminder_short_description: 'Call customer back about promotions',
             reminder_datetime: new Date('09/19/2017 10:30') // JS Date Object
         },{
             reminder_id : '1234568',
             reminder_title: 'Call customer about appointment',
             reminder_short_description: 'Check with the customer about availability',
             reminder_datetime: new Date('09/15/2017 14:30') // JS Date Object
         },
     ]
}
);
```

### Reminders list input format
```
[
         {
             reminder_id : '1234567',
             reminder_title: 'Callback reminder',
             reminder_short_description: 'Call customer back about promotions',
             reminder_datetime: new Date('09/19/2017 10:30') // JS Date Object
         },{
             reminder_id : '1234568',
             reminder_title: 'Call customer about appointment',
             reminder_short_description: 'Check with the customer about availability',
             reminder_datetime: new Date('09/15/2017 14:30') // JS Date Object
         },
]
```



| Property | Meaning |
| --- | --- |
| snoozeInterval | Number: Interval between the time user snoozes the reminder and it appearing back again |
| cssClassList | Array of Strings: You can give it a list of css classes to be added. For example animate.css classes can be passed for show animation. Ex: ["animated", "bounceInLeft"] |
| completionCallback | Function  (optional): If you want to handle the completion of a reminder, ex: saving to DB |
| snoozeCallback | Function  (optional): If you want to handle a snooze event, ex: saving to DB |
| reminderDisplayCallback | Function  (optional): If you want to handle the event of the reminder appearing on screen, ex: Updating pending reminders count somewhere in the UI |
| position | String  (optional, default is topRight): Position of the notifications. Applies only when useNoty is false(default), since Noty has its position set in notySettings. Options: top, topRight, topLeft, bottom, bottomRight, bottomLeft |
| responsePayloadStructure | Object (optional, default fields are shown above): ReminderJS needs to understand the response payload from your server for id, title, description, timestamp fields. |



