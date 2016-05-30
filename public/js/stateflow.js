/**
 * StateFlow
 * 
 * james.li1@uq.edu.au
 * 
 * Very basic state management for page blocks in MOOCchat. 
 */

var StateFlow = (function(){
    // These are all internal functions and are not exposed
    var currentState = {
        id: null,
        startTime: null
    };
    
    /**
     * Stores state-page-action information registered to the StateFlow object
     */
    var stateActionDict = {};
    
    
    function getNowTimestamp() {
        return new Date().valueOf();
    }
    
    function getCurrentStateTime() {
        return Math.floor((getNowTimestamp() - getCurrentState().startTime) / 1000);
    }
    
    function getCurrentPageName() {
        return stateActionDict[getCurrentState().id].page;
    }
    
    function getCurrentState() {
        return currentState;
    }
    
    function setNewState(stateId) {
        currentState.id = stateId;
        currentState.startTime = getNowTimestamp();
    }
    
    
    
    return {
        /**
         * Registers a "state" into StateFlow.
         * 
         * StateData structure = 
         * {
         *      state: STATE_ID,    // Must be unique, and be either a number or string!
         *      page: PAGE_ID,
         *      onEnter: function(data) {
         *          // Optional
         *          // Something to do just after page block revealed/state entered
         *      },
         *      onLeave: function(data) {
         *          // Optional
         *          // Something to do just before page block hidden/state left
         *      }
         * }
         * 
         * @param {StateData} data (See function description for StateData structure.)
         */
        register: function(data) {
            stateActionDict[data.state] = data;
        },
        
        /**
         * Registers multiple "states" into StateFlow.
         * 
         * @param {StateData[]} arr (See .register() for info on StateData.)
         */
        registerAll: function(arr) {
            arr.forEach(function(data) {
                StateFlow.register(data);
            });
        },
        
        getPageName: getCurrentPageName,
        
        /**
         * Gets the $/jQuery selected root element of the page block for the state.
         */
        getRootElem: function() {
            return $(getCurrentPageName());
        },
        
        goTo: function(stateId, data) {
            if (getCurrentState().id) {
                var timeSpent = getCurrentStateTime();
                //console.log(timeSpent);
                ga('send', 'event', getCurrentPageName(), timeSpent);
                
                var onLeave = stateActionDict[getCurrentState().id].onLeave;
            
                if (onLeave) {
                    onLeave(data);
                }
            }
            
            //      Old page
            // --------------------
            //      New page
            
            setNewState(stateId);
            
            // Show only the relevant page block
            $('.moocchat-page').addClass('hidden');
            StateFlow.getRootElem().removeClass('hidden');
            
            // Set the hash at the end to reflect the current page, not state
            window.location.replace(getCurrentPageName());
            
            var onEnter = stateActionDict[getCurrentState().id].onEnter;
        
            if (onEnter) {
                onEnter(data);
            }
        }
    }
})();