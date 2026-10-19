/* Crew Map: one switch for the move to private data.
   PRIVATE:false = today: roster/activity from the public data branch, no sign-in.
   PRIVATE:true  = owner-only: Google sign-in (shared with Logbook/Pantry), data from Firestore crewMap/*; everyone else sees "Private app".
   Flip only after the Firestore rules are published and the box writer (tools/firestore-writer) is running.
   Preview the gate without flipping: add ?private=1 to the URL. */
window.CREW_CFG={PRIVATE:false,OWNER_UID:''};
