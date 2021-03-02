/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import ActionHeader from 'woocommerce/components/action-header';
import Main from 'calypso/components/main';
import StoreMoveNoticeView from './store-move-notice-view';

class Dashboard extends Component {
	static propTypes = {
		className: PropTypes.string,
	};

	render() {
		const { className, translate } = this.props;

		return (
			<Main className={ classNames( 'dashboard', className ) } wideLayout={ true }>
				<ActionHeader breadcrumbs={ translate( 'Store' ) } />
				<StoreMoveNoticeView />
			</Main>
		);
	}
}

export default localize( Dashboard );
