import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import { Route } from 'react-router'
import { TabBar } from 'react-native-tab-view'
import { TabStack } from 'react-router-navigation-core'
import DefaultTabsRenderer from './DefaultTabsRenderer'

const styles = StyleSheet.create({
  tabLabel: {
    backgroundColor: 'transparent',
    color: 'white',
    margin: 8,
  },
})

class Tabs extends React.Component {
  renderTabBar = tabBarProps => {
    const renderTabBar = tabBarProps.renderTabBar || this.props.renderTabBar
    if (tabBarProps.hideTabBar) return null
    if (renderTabBar) {
      return React.createElement(renderTabBar, {
        ...tabBarProps,
        renderLabel: scene => this.renderTabLabel(tabBarProps, scene),
      })
    }
    return (
      <TabBar
        {...tabBarProps}
        renderLabel={scene => this.renderTabLabel(tabBarProps, scene)}
      />
    )
  }

  renderTabLabel = (tabLabelProps, scene) => {
    const { tabs } = tabLabelProps
    const { route, focused } = scene
    const activeTab = tabs.find(tab => tab.path === route.routeName)
    const tabsProps = { ...tabLabelProps, ...activeTab }
    const { tabTintColor, tabActiveTintColor } = tabsProps
    if (tabsProps.renderLabel) return tabsProps.renderLabel(tabsProps, scene)
    return (
      <Text
        style={[
          styles.tabLabel,
          tabsProps.labelStyle,
          !focused && tabTintColor && { color: tabTintColor },
          focused && tabActiveTintColor && { color: tabActiveTintColor },
        ]}
      >
        {tabsProps && tabsProps.label}
      </Text>
    )
  }

  render() {
    return (
      <Route>
        {({ history }) => (
          <TabStack
            {...this.props}
            history={history}
            render={tabsRendererProps => (
              <DefaultTabsRenderer
                {...this.props}
                {...tabsRendererProps}
                renderTabBar={this.renderTabBar}
              />
            )}
          />
        )}
      </Route>
    )
  }
}

export default Tabs
