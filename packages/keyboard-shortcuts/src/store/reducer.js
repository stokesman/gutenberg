/**
 * Reducer returning the registered shortcuts
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
function reducer( state = { suppressions: new Set() }, action ) {
	switch ( action.type ) {
		case 'REGISTER_SHORTCUT':
			return {
				...state,
				[ action.name ]: {
					category: action.category,
					keyCombination: action.keyCombination,
					aliases: action.aliases,
					description: action.description,
				},
			};
		case 'UNREGISTER_SHORTCUT':
			const { [ action.name ]: actionName, ...remainingState } = state;
			return remainingState;
		case 'ADD_SUPPRESSION':
			return {
				...state,
				suppressions: new Set( [ ...state.suppressions, action.name ] ),
			};
		case 'REMOVE_SUPPRESSION':
			const suppressions = new Set( [ ...state.suppressions ] );
			suppressions.delete( action.name );
			return { ...state, suppressions };
	}

	return state;
}

export default reducer;
