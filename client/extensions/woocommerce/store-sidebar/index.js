/**
 * External dependencies
 */

import config from '@automattic/calypso-config';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { areAllRequiredPluginsActive } from 'woocommerce/state/selectors/plugins';
import { areCountsLoaded, getCountProducts } from 'woocommerce/state/sites/data/counts/selectors';
import {
	areSettingsGeneralLoaded,
	getStoreLocation,
} from 'woocommerce/state/sites/settings/general/selectors';
import Count from 'calypso/components/count';
import { fetchCounts } from 'woocommerce/state/sites/data/counts/actions';
import { fetchSetupChoices } from 'woocommerce/state/sites/setup-choices/actions';
import { getSelectedSiteWithFallback } from 'woocommerce/state/sites/selectors';
import { getSetStoreAddressDuringInitialSetup } from 'woocommerce/state/sites/setup-choices/selectors';
import { isLoaded as arePluginsLoaded } from 'calypso/state/plugins/installed/selectors';
import { isStoreManagementSupportedInCalypsoForCountry } from 'woocommerce/lib/countries';
import getCurrentQueryArguments from 'calypso/state/selectors/get-current-query-arguments';
import Sidebar from 'calypso/layout/sidebar';
import SidebarItem from 'calypso/layout/sidebar/item';
import SidebarMenu from 'calypso/layout/sidebar/menu';
import SidebarSeparator from 'calypso/layout/sidebar/separator';
import StoreGroundControl from './store-ground-control';
import QuerySettingsGeneral from 'woocommerce/components/query-settings-general';

class StoreSidebar extends Component {
	static propTypes = {
		path: PropTypes.string.isRequired,
		site: PropTypes.object,
	};

	componentDidMount() {
		const { siteId } = this.props;

		if ( siteId ) {
			this.fetchData();
		}
	}

	componentDidUpdate( prevProps ) {
		const { allRequiredPluginsActive, pluginsLoaded, siteId } = this.props;
		const oldSiteId = prevProps.siteId ? prevProps.siteId : null;

		// If the site has changed, or plugin status has changed, re-fetch data
		if (
			siteId !== oldSiteId ||
			prevProps.allRequiredPluginsActive !== allRequiredPluginsActive ||
			prevProps.pluginsLoaded !== pluginsLoaded
		) {
			this.fetchData();
		}
	}

	fetchData = () => {
		const { isLoaded, siteId } = this.props;
		if ( ! isLoaded ) {
			this.props.fetchCounts( siteId );
		}

		this.props.fetchSetupChoices( siteId );
	};

	isItemLinkSelected = ( paths ) => {
		if ( ! Array.isArray( paths ) ) {
			paths = [ paths ];
		}

		return paths.some( function ( path ) {
			return path === this.props.path || 0 === this.props.path.indexOf( path + '/' );
		}, this );
	};

	shouldShowAllSidebarItems = () => {
		const {
			finishedAddressSetup,
			hasProducts,
			path,
			settingsGeneralLoaded,
			siteSuffix,
			storeLocation,
			shouldRedirectAfterInstall,
		} = this.props;

		// Show all items if: we're not on the dashboard, we have finished setup, or we have products.
		const notOnDashboard = 0 !== path.indexOf( '/store' + siteSuffix );
		let showAllSidebarItems = notOnDashboard || finishedAddressSetup || hasProducts;

		// Don't show all the sidebar items if we don't know what country the store is in
		if ( showAllSidebarItems ) {
			if ( ! settingsGeneralLoaded ) {
				showAllSidebarItems = false;
			} else {
				const storeCountry = get( storeLocation, 'country' );
				showAllSidebarItems = isStoreManagementSupportedInCalypsoForCountry( storeCountry );
			}

			// Don't show sidebar items if store's removed & user is going to redirect
			// to WooCommerce after installation
			if ( shouldRedirectAfterInstall ) {
				showAllSidebarItems = false;
			}
		}

		return showAllSidebarItems;
	};

	dashboard = () => {
		const { site, siteSuffix, translate } = this.props;
		const link = '/store' + siteSuffix;
		const selected = this.isItemLinkSelected( link );
		const classes = classNames( {
			dashboard: true,
			'is-placeholder': ! site,
			selected,
		} );

		return (
			<SidebarItem
				className={ classes }
				icon="house"
				label={ translate( 'Dashboard' ) }
				link={ link }
			/>
		);
	};

	products = () => {
		const { site, translate } = this.props;

		const link = site.URL + '/wp-admin/edit.php?post_type=product';
		const selected = false;

		const classes = classNames( {
			products: true,
			'is-placeholder': ! site,
			selected,
		} );

		return (
			<SidebarItem
				className={ classes }
				icon="product"
				label={ translate( 'Products' ) }
				link={ link }
			/>
		);
	};

	reviews = () => {
		const { site, translate, totalPendingReviews } = this.props;
		const link = site.URL + '/wp-admin/edit-comments.php';
		const selected = false;

		const classes = classNames( {
			reviews: true,
			'is-placeholder': ! site,
			selected,
		} );

		return (
			<SidebarItem
				className={ classes }
				icon="star-outline"
				label={ translate( 'Reviews' ) }
				link={ link }
			>
				{ totalPendingReviews ? <Count count={ totalPendingReviews } /> : null }
			</SidebarItem>
		);
	};

	orders = () => {
		const { totalNewOrders, site, translate } = this.props;

		const link = site.URL + '/wp-admin/edit.php?post_type=shop_order';
		const selected = false;

		const classes = classNames( {
			orders: true,
			'is-placeholder': ! site,
			selected,
		} );

		return (
			<SidebarItem className={ classes } icon="pages" label={ translate( 'Orders' ) } link={ link }>
				{ totalNewOrders ? <Count count={ totalNewOrders } /> : null }
			</SidebarItem>
		);
	};

	promotions = () => {
		// TODO: Remove this check when ready to release to production.
		if ( ! config.isEnabled( 'woocommerce/extension-promotions' ) ) {
			return null;
		}

		const { site, translate } = this.props;

		const link = site.URL + '/wp-admin/edit.php?post_type=shop_coupon';
		const selected = false;

		const classes = classNames( {
			promotions: true,
			'is-placeholder': ! site,
			selected,
		} );

		return (
			<SidebarItem
				className={ classes }
				icon="gift"
				label={ translate( 'Promotions' ) }
				link={ link }
			/>
		);
	};

	settings = () => {
		const { site, translate } = this.props;

		const link = site.URL + '/wp-admin/admin.php?page=wc-settings';
		const selected = false;

		const classes = classNames( {
			settings: true,
			'is-placeholder': ! site,
			selected,
		} );

		return (
			<SidebarItem
				className={ classes }
				icon="cog"
				label={ translate( 'Settings' ) }
				link={ link }
			/>
		);
	};

	render = () => {
		const { allRequiredPluginsActive, pluginsLoaded, site, siteId } = this.props;
		const showAllSidebarItems = this.shouldShowAllSidebarItems();
		const shouldLoadSettings = pluginsLoaded && allRequiredPluginsActive;

		return (
			<Sidebar className="store-sidebar__sidebar">
				<StoreGroundControl site={ site } />
				<SidebarMenu>
					{ this.dashboard() }
					{ showAllSidebarItems && this.products() }
					{ showAllSidebarItems && this.orders() }
					{ showAllSidebarItems && this.promotions() }
					{ showAllSidebarItems && this.reviews() }
					{ showAllSidebarItems && <SidebarSeparator /> }
					{ showAllSidebarItems && this.settings() }
				</SidebarMenu>
				{ shouldLoadSettings && <QuerySettingsGeneral siteId={ siteId } /> }
			</Sidebar>
		);
	};
}

function mapStateToProps( state ) {
	const site = getSelectedSiteWithFallback( state );
	const siteId = site ? site.ID : null;
	const finishedAddressSetup = getSetStoreAddressDuringInitialSetup( state );
	const hasProducts = getCountProducts( state ) > 0;
	const isLoaded = areCountsLoaded( state );
	const settingsGeneralLoaded = areSettingsGeneralLoaded( state, siteId );
	const storeLocation = getStoreLocation( state, siteId );
	const pluginsLoaded = arePluginsLoaded( state, siteId );
	const allRequiredPluginsActive = areAllRequiredPluginsActive( state, siteId );
	const shouldRedirectAfterInstall =
		'' === get( getCurrentQueryArguments( state ), 'redirect_after_install' );
	const totalNewOrders = 0;
	const totalPendingReviews = 0;

	return {
		allRequiredPluginsActive,
		finishedAddressSetup,
		hasProducts,
		isLoaded,
		totalNewOrders,
		totalPendingReviews,
		pluginsLoaded,
		settingsGeneralLoaded,
		site,
		siteId,
		siteSuffix: site ? '/' + site.slug : '',
		storeLocation,
		shouldRedirectAfterInstall,
	};
}

function mapDispatchToProps( dispatch ) {
	return bindActionCreators(
		{
			fetchCounts,
			fetchSetupChoices,
		},
		dispatch
	);
}

export default connect( mapStateToProps, mapDispatchToProps )( localize( StoreSidebar ) );
