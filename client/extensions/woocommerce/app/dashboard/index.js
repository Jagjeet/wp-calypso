/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import ActionHeader from 'woocommerce/components/action-header';
import Main from 'calypso/components/main';
import StoreMoveNoticeView from './store-move-notice-view';
import { getSelectedSiteWithFallback } from 'woocommerce/state/sites/selectors';
import { getSiteOption } from 'calypso/state/sites/selectors';

class Dashboard extends Component {
	static propTypes = {
		className: PropTypes.string,
	};

	componentDidMount() {
		this.maybeRedirectToWooCommerceInstallation( this.props );
	}

	shouldComponentUpdate( nextProps ) {
		this.maybeRedirectToWooCommerceInstallation( nextProps );
	}

	maybeRedirectToWooCommerceInstallation( props ) {
		if ( ! props.isSiteWpcomStore ) {
			window.location = '/woocommerce-installation/' + props.siteSlug;
		}
	}

	render() {
		const { className, isSiteWpcomStore, translate } = this.props;

		if ( ! isSiteWpcomStore ) {
			return null;
		}

		return (
			<Main className={ classNames( 'dashboard', className ) } wideLayout={ true }>
				<ActionHeader breadcrumbs={ translate( 'Store' ) } />
				<StoreMoveNoticeView />
			</Main>
		);
	}
}

function mapStateToProps( state ) {
	const selectedSite = getSelectedSiteWithFallback( state );
	const siteId = selectedSite ? selectedSite.ID : null;
	const siteSlug = selectedSite ? selectedSite.slug : '';

	// Assume that we are dealing with a site that had Store until we can
	// check for sure, to avoid prematurely redirecting away from the dashboard
	const isSiteWpcomStore = siteId ? getSiteOption( state, siteId, 'is_wpcom_store' ) : true;

	return {
		isSiteWpcomStore,
		siteSlug,
	};
}

export default connect( mapStateToProps, {} )( localize( Dashboard ) );
