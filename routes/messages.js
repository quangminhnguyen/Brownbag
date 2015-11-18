/*

send message
  create message
  save in table.

get list of people/restaurants messaged
  iterate through messages table
  if from = me
    user = getuser(toId)
  else if to = me
    user = getuser(fromID)
  
  add to list if not already there. 


get list of messages to person/restaurant
  iterate through messages table
  
  if (me = from || them == to)  || (me = to || them == from)
    add to list, could also add to or from field for nicer looking view
  
  sort by timestamp
  return list

*/