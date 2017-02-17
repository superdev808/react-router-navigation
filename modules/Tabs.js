/* @flow */
/* eslint max-len: 0 */
/* eslint react/no-unused-prop-types: 0 */

import React, { Component, createElement } from 'react'
import { StyleSheet, Dimensions, Text } from 'react-native'
import { TabViewAnimated, TabBar } from 'react-native-tab-view'
import type { SceneRendererProps as TabSceneRendererProps, Scene } from 'react-native-tab-view/src/TabViewTypeDefinitions'
import type { TabBarProps, TabRendererProps } from './TypeDefinitions'
import TabStack from './TabStack'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  tabLabel: {
    backgroundColor: 'transparent',
    color: 'white',
    margin: 8,
  },
})

type SceneRendererProps = TabSceneRendererProps & TabRendererProps

type Props = TabBarProps & {
  children: Array<React$Element<any>>,
}

class Tabs extends Component<void, Props, void> {

  props: Props

  renderHeader = (props: SceneRendererProps): React$Element<any> => {
    const { tabs, navigationState: { routes, index } } = props
    // Get current tab
    const tab = tabs.find(({ key }) => routes[index].key === key)
    // Get tab bar props
    const tabBarProps = { ...this.props, ...props, ...tab }
    // Custom tab bar
    if (tabBarProps.renderTabBar) {
      return createElement(
        tabBarProps.renderTabBar,
        tabBarProps,
      )
    }
    return (
      <TabBar
        {...tabBarProps}
        style={tabBarProps.tabBarStyle}
        indicatorStyle={tabBarProps.tabBarIndicatorStyle}
        renderLabel={({ route }) => {
          const currentTab = tabs.find(({ key }) => route.key === key)
          return (
            <Text
              style={[
                styles.tabLabel,
                tabBarProps.labelStyle,
                currentTab && currentTab.labelStyle,
              ]}
            >
              {currentTab && currentTab.label}
            </Text>
          )
        }}
      />
    )
  }

  renderScene = (props: SceneRendererProps & Scene): ?React$Element<any> => {
    // Get tab
    const { tabs, route } = props
    const tab = tabs.find(({ key }) => key === route.key)
    if (!tab) return null
    // Render view
    if (tab.render) return tab.render(props)
    else if (tab.children) return tab.children(props)
    else if (tab.component) return createElement(tab.component, props)
    return null
  }

  render(): React$Element<any> {
    return (
      <TabStack
        {...this.props}
        style={styles.container}
        render={(props) => (
          <TabViewAnimated
            {...props}
            style={styles.container}
            initialLayout={Dimensions.get('window')}
            renderHeader={(ownProps) => this.renderHeader({ ...props, ...ownProps })}
            renderScene={({ ...ownProps }) => this.renderScene({ ...props, ...ownProps })}
          />
        )}
      />
    )
  }

}

export default Tabs
